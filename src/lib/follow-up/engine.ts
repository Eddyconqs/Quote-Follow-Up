import "server-only";
import type { Prisma, FollowUpEnrollment, FollowUpStep, Quote, Customer, Company } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { renderTemplate } from "@/lib/templates";
import { formatCurrency } from "@/lib/utils";
import { computeStepSendTime, parseBusinessHours } from "@/lib/follow-up/business-hours";
import { sendViaChannel } from "@/lib/providers/dispatch";
import { assertSendAllowed } from "@/lib/compliance/send-gate";
import { buildUnsubscribeUrl, appendUnsubscribeFooter } from "@/lib/compliance/unsubscribe-link";

type TxClient = Prisma.TransactionClient;

/** Activates a follow-up sequence for a quote. Fails loudly on terminal quote states. */
export async function activateFollowUp(quoteId: string, companyId: string, sequenceId: string | undefined, userId: string) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirstOrThrow({
      where: { id: quoteId, companyId },
      include: { customer: true, company: true },
    });

    if (["WON", "LOST"].includes(quote.status)) {
      throw new Error("QUOTE_TERMINAL");
    }

    const existingActive = await tx.followUpEnrollment.findFirst({
      where: { quoteId, status: { in: ["ACTIVE", "PAUSED"] } },
    });
    if (existingActive) {
      throw new Error("ALREADY_ENROLLED");
    }

    const sequence = sequenceId
      ? await tx.followUpSequence.findFirstOrThrow({
          where: { id: sequenceId, companyId },
          include: { steps: { orderBy: { stepNumber: "asc" } } },
        })
      : await tx.followUpSequence.findFirstOrThrow({
          where: { companyId, language: quote.customer.preferredLanguage, isDefault: true },
          include: { steps: { orderBy: { stepNumber: "asc" } } },
        });

    const firstStep = sequence.steps[0];
    if (!firstStep) throw new Error("SEQUENCE_HAS_NO_STEPS");

    const businessHours = parseBusinessHours(quote.company.businessHours);
    const nextRunAt = computeStepSendTime(new Date(), firstStep.delayInDays, quote.company.timeZone, businessHours);

    const enrollment = await tx.followUpEnrollment.create({
      data: {
        companyId,
        quoteId,
        sequenceId: sequence.id,
        status: "ACTIVE",
        currentStep: 0,
        nextRunAt,
      },
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: {
        followUpStatus: "ACTIVE",
        nextFollowUpAt: nextRunAt,
        status: quote.status === "DRAFT" ? "FOLLOW_UP_SCHEDULED" : quote.status === "SENT" ? "FOLLOW_UP_SCHEDULED" : quote.status,
      },
    });

    await logActivity(tx, {
      companyId,
      quoteId,
      userId,
      type: "FOLLOW_UP_ACTIVATED",
      description: `Follow-up sequence "${sequence.name}" activated.`,
      metadata: { sequenceId: sequence.id, enrollmentId: enrollment.id },
    });

    return enrollment;
  });
}

export async function pauseFollowUp(enrollmentId: string, companyId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.followUpEnrollment.findFirstOrThrow({ where: { id: enrollmentId, companyId } });
    if (enrollment.status !== "ACTIVE") throw new Error("NOT_ACTIVE");

    await tx.followUpEnrollment.update({ where: { id: enrollmentId }, data: { status: "PAUSED", pausedAt: new Date() } });
    await tx.quote.update({ where: { id: enrollment.quoteId }, data: { followUpStatus: "PAUSED", status: "PAUSED" } });

    await logActivity(tx, {
      companyId,
      quoteId: enrollment.quoteId,
      userId,
      type: "FOLLOW_UP_PAUSED",
      description: "Follow-up sequence paused.",
    });
  });
}

export async function resumeFollowUp(enrollmentId: string, companyId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.followUpEnrollment.findFirstOrThrow({
      where: { id: enrollmentId, companyId },
      include: { quote: { include: { company: true } } },
    });
    if (enrollment.status !== "PAUSED") throw new Error("NOT_PAUSED");

    const businessHours = parseBusinessHours(enrollment.quote.company.businessHours);
    const nextRunAt = computeStepSendTime(new Date(), 0, enrollment.quote.company.timeZone, businessHours);

    await tx.followUpEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE", pausedAt: null, nextRunAt },
    });
    await tx.quote.update({
      where: { id: enrollment.quoteId },
      data: { followUpStatus: "ACTIVE", nextFollowUpAt: nextRunAt, status: "FOLLOW_UP_SCHEDULED" },
    });

    await logActivity(tx, {
      companyId,
      quoteId: enrollment.quoteId,
      userId,
      type: "FOLLOW_UP_RESUMED",
      description: "Follow-up sequence resumed.",
    });
  });
}

async function cancelEnrollment(tx: TxClient, enrollment: FollowUpEnrollment, reason: string, userId?: string | null) {
  if (enrollment.status === "CANCELLED" || enrollment.status === "COMPLETED") return;

  await tx.followUpEnrollment.update({
    where: { id: enrollment.id },
    data: { status: "CANCELLED", completedAt: new Date(), nextRunAt: null },
  });

  await logActivity(tx, {
    companyId: enrollment.companyId,
    quoteId: enrollment.quoteId,
    userId,
    type: "FOLLOW_UP_CANCELLED",
    description: `Follow-up sequence cancelled: ${reason}.`,
  });
}

/** Cancels every active/paused enrollment for a quote. Used when a quote reaches a terminal or interrupting state. */
export async function cancelActiveEnrollmentsForQuote(
  tx: TxClient,
  quoteId: string,
  companyId: string,
  reason: string,
  userId?: string | null
) {
  const enrollments = await tx.followUpEnrollment.findMany({
    where: { quoteId, companyId, status: { in: ["ACTIVE", "PAUSED"] } },
  });
  for (const enrollment of enrollments) {
    await cancelEnrollment(tx, enrollment, reason, userId);
  }
  if (enrollments.length > 0) {
    await tx.quote.update({ where: { id: quoteId }, data: { followUpStatus: "CANCELLED", nextFollowUpAt: null } });
  }
}

type EnrollmentWithContext = FollowUpEnrollment & {
  sequence: { steps: FollowUpStep[] };
  quote: Quote & { customer: Customer; company: Company };
};

async function advancePastStep(tx: TxClient, enrollment: EnrollmentWithContext) {
  const steps = enrollment.sequence.steps;
  const nextIndex = enrollment.currentStep + 1;

  if (nextIndex >= steps.length) {
    await tx.followUpEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "COMPLETED", completedAt: new Date(), nextRunAt: null, currentStep: nextIndex },
    });
    await tx.quote.update({ where: { id: enrollment.quoteId }, data: { followUpStatus: "COMPLETED", nextFollowUpAt: null } });
    return;
  }

  const businessHours = parseBusinessHours(enrollment.quote.company.businessHours);
  const nextRunAt = computeStepSendTime(
    new Date(),
    steps[nextIndex].delayInDays,
    enrollment.quote.company.timeZone,
    businessHours
  );

  await tx.followUpEnrollment.update({
    where: { id: enrollment.id },
    data: { currentStep: nextIndex, nextRunAt },
  });
  await tx.quote.update({ where: { id: enrollment.quoteId }, data: { nextFollowUpAt: nextRunAt } });
}

function templateVars(quote: Quote, customer: Customer) {
  return {
    firstName: customer.firstName,
    quoteTitle: quote.title,
    quoteAmount: formatCurrency(quote.amount.toString(), quote.currency, customer.preferredLanguage === "FR" ? "fr" : "en"),
  };
}

/**
 * The scheduler tick. Finds every ACTIVE enrollment due to run, sends (or queues
 * for approval) the current step's message, and advances the enrollment. Each
 * enrollment is processed in its own transaction with a fresh status re-check to
 * avoid duplicate sends if the tick is triggered concurrently.
 */
export async function processDueEnrollments(now: Date = new Date()) {
  const due = await prisma.followUpEnrollment.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: now } },
    select: { id: true },
  });

  const results: Array<{ enrollmentId: string; outcome: string }> = [];

  for (const { id } of due) {
    const outcome = await prisma.$transaction(async (tx) => {
      const enrollment = (await tx.followUpEnrollment.findUnique({
        where: { id },
        include: {
          sequence: { include: { steps: { orderBy: { stepNumber: "asc" } } } },
          quote: { include: { customer: true, company: true } },
        },
      })) as EnrollmentWithContext | null;

      if (!enrollment || enrollment.status !== "ACTIVE" || !enrollment.nextRunAt || enrollment.nextRunAt > now) {
        return "skipped";
      }

      const step = enrollment.sequence.steps[enrollment.currentStep];
      if (!step) {
        await advancePastStep(tx, enrollment);
        return "completed";
      }

      const { quote, quote: { customer, company } } = enrollment;

      // Duplicate-send guard: a message for this exact step already exists.
      const existingMessage = await tx.message.findFirst({
        where: { quoteId: quote.id, followUpStepId: step.id, status: { in: ["SENT", "DELIVERED", "PENDING_APPROVAL", "REPLIED"] } },
      });
      if (existingMessage) {
        await advancePastStep(tx, enrollment);
        return "duplicate-skipped";
      }

      let body = renderTemplate(step.message, templateVars(quote, customer));
      const subject = step.subject ?? renderTemplate(quote.language === "FR" ? "Suivi: {{quoteTitle}}" : "Follow-up: {{quoteTitle}}", templateVars(quote, customer));

      if (step.channel === "EMAIL") {
        body = appendUnsubscribeFooter(body, buildUnsubscribeUrl(customer, "EMAIL"), quote.language);
      }

      if (step.channel === "MANUAL_TASK") {
        const message = await tx.message.create({
          data: {
            companyId: company.id,
            quoteId: quote.id,
            customerId: customer.id,
            followUpStepId: step.id,
            channel: "MANUAL_TASK",
            direction: "OUTBOUND",
            status: "PENDING_APPROVAL",
            subject,
            body,
          },
        });
        await logActivity(tx, {
          companyId: company.id,
          quoteId: quote.id,
          type: "MESSAGE_SCHEDULED",
          description: "Manual follow-up task created — requires a team member to complete it.",
          metadata: { messageId: message.id, stepId: step.id },
        });
        await advancePastStep(tx, enrollment);
        return "manual-task-created";
      }

      const gateResult = await assertSendAllowed(tx, { company, customer, companyId: company.id, channel: step.channel });
      if (!gateResult.allowed) {
        await logActivity(tx, {
          companyId: company.id,
          quoteId: quote.id,
          type: "MESSAGE_BLOCKED_COMPLIANCE",
          description: `Step skipped: compliance gate blocked ${step.channel.toLowerCase()} send (${gateResult.reason}).`,
          metadata: { stepId: step.id, channel: step.channel, reason: gateResult.reason },
        });
        await advancePastStep(tx, enrollment);
        return "skipped-compliance";
      }

      if (step.requiresApproval) {
        const message = await tx.message.create({
          data: {
            companyId: company.id,
            quoteId: quote.id,
            customerId: customer.id,
            followUpStepId: step.id,
            channel: step.channel,
            direction: "OUTBOUND",
            status: "PENDING_APPROVAL",
            subject,
            body,
            scheduledAt: enrollment.nextRunAt,
          },
        });
        // Do not advance yet: progression resumes once a team member approves and sends.
        await tx.followUpEnrollment.update({ where: { id: enrollment.id }, data: { nextRunAt: null } });
        await logActivity(tx, {
          companyId: company.id,
          quoteId: quote.id,
          type: "MESSAGE_SCHEDULED",
          description: "Message drafted and awaiting approval before sending.",
          metadata: { messageId: message.id, stepId: step.id },
        });
        return "pending-approval";
      }

      const message = await tx.message.create({
        data: {
          companyId: company.id,
          quoteId: quote.id,
          customerId: customer.id,
          followUpStepId: step.id,
          channel: step.channel,
          direction: "OUTBOUND",
          status: "SCHEDULED",
          subject,
          body,
          scheduledAt: enrollment.nextRunAt,
        },
      });

      const sendResult = await sendViaChannel(step.channel, {
        to: step.channel === "EMAIL" ? customer.email! : customer.phone!,
        subject,
        body,
        language: quote.language,
      });

      if (sendResult.status === "sent") {
        await tx.message.update({
          where: { id: message.id },
          data: { status: "SENT", sentAt: new Date(), deliveredAt: new Date(), providerMessageId: sendResult.providerMessageId },
        });
        await logActivity(tx, {
          companyId: company.id,
          quoteId: quote.id,
          type: "MESSAGE_SENT",
          description: `${step.channel} follow-up sent (step ${step.stepNumber}).`,
          metadata: { messageId: message.id, stepId: step.id },
        });
      } else {
        await tx.message.update({
          where: { id: message.id },
          data: { status: "FAILED", failureReason: sendResult.failureReason },
        });
        await logActivity(tx, {
          companyId: company.id,
          quoteId: quote.id,
          type: "MESSAGE_FAILED",
          description: `${step.channel} follow-up failed to send (step ${step.stepNumber}).`,
          metadata: { messageId: message.id, stepId: step.id, reason: sendResult.failureReason },
        });
      }

      await advancePastStep(tx, enrollment);
      return sendResult.status === "sent" ? "sent" : "send-failed";
    });

    results.push({ enrollmentId: id, outcome });
  }

  return results;
}

/** Approves a pending-approval message, sends it, and resumes the enrollment's progression. */
export async function approveAndSendMessage(messageId: string, companyId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.findFirstOrThrow({
      where: { id: messageId, companyId, status: "PENDING_APPROVAL" },
      include: { quote: { include: { customer: true, company: true } }, followUpStep: true },
    });

    if (message.channel === "MANUAL_TASK") {
      throw new Error("MANUAL_TASK_CANNOT_BE_SENT");
    }
    const channel = message.channel;

    const gateResult = await assertSendAllowed(tx, {
      company: message.quote.company,
      customer: message.quote.customer,
      companyId,
      channel,
    });
    if (!gateResult.allowed) {
      await logActivity(tx, {
        companyId,
        quoteId: message.quoteId,
        userId,
        type: "MESSAGE_BLOCKED_COMPLIANCE",
        description: `Approved message blocked by compliance gate (${gateResult.reason}).`,
        metadata: { messageId: message.id, reason: gateResult.reason },
      });
      throw new Error(`COMPLIANCE_BLOCKED_${gateResult.reason}`);
    }

    const sendResult = await sendViaChannel(channel, {
      to: channel === "EMAIL" ? message.quote.customer.email! : message.quote.customer.phone!,
      subject: message.subject ?? "",
      body: message.body,
      language: message.quote.language,
    });

    await tx.message.update({
      where: { id: message.id },
      data:
        sendResult.status === "sent"
          ? { status: "SENT", sentAt: new Date(), deliveredAt: new Date(), providerMessageId: sendResult.providerMessageId }
          : { status: "FAILED", failureReason: sendResult.failureReason },
    });

    await logActivity(tx, {
      companyId,
      quoteId: message.quoteId,
      userId,
      type: sendResult.status === "sent" ? "MESSAGE_SENT" : "MESSAGE_FAILED",
      description: sendResult.status === "sent" ? "Approved message sent." : "Approved message failed to send.",
      metadata: { messageId: message.id },
    });

    const enrollment = (await tx.followUpEnrollment.findFirst({
      where: { quoteId: message.quoteId, status: "ACTIVE" },
      include: {
        sequence: { include: { steps: { orderBy: { stepNumber: "asc" } } } },
        quote: { include: { customer: true, company: true } },
      },
    })) as EnrollmentWithContext | null;

    if (enrollment) {
      await advancePastStep(tx, enrollment);
    }

    return sendResult;
  });
}

/** Manually retries a failed message using the same channel and body. */
export async function retryMessage(messageId: string, companyId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.findFirstOrThrow({
      where: { id: messageId, companyId, status: "FAILED" },
      include: { quote: { include: { customer: true, company: true } } },
    });

    if (message.channel === "MANUAL_TASK") {
      throw new Error("MANUAL_TASK_CANNOT_BE_RETRIED");
    }
    const channel = message.channel;

    const gateResult = await assertSendAllowed(tx, {
      company: message.quote.company,
      customer: message.quote.customer,
      companyId,
      channel,
    });
    if (!gateResult.allowed) {
      await logActivity(tx, {
        companyId,
        quoteId: message.quoteId,
        userId,
        type: "MESSAGE_BLOCKED_COMPLIANCE",
        description: `Retry blocked by compliance gate (${gateResult.reason}).`,
        metadata: { messageId: message.id, reason: gateResult.reason },
      });
      throw new Error(`COMPLIANCE_BLOCKED_${gateResult.reason}`);
    }

    const sendResult = await sendViaChannel(channel, {
      to: channel === "EMAIL" ? message.quote.customer.email! : message.quote.customer.phone!,
      subject: message.subject ?? "",
      body: message.body,
      language: message.quote.language,
    });

    await tx.message.update({
      where: { id: message.id },
      data:
        sendResult.status === "sent"
          ? { status: "SENT", sentAt: new Date(), deliveredAt: new Date(), providerMessageId: sendResult.providerMessageId, failureReason: null }
          : { status: "FAILED", failureReason: sendResult.failureReason },
    });

    await logActivity(tx, {
      companyId,
      quoteId: message.quoteId,
      userId,
      type: sendResult.status === "sent" ? "MESSAGE_SENT" : "MESSAGE_FAILED",
      description: sendResult.status === "sent" ? "Message retried and sent successfully." : "Message retry failed again.",
      metadata: { messageId: message.id },
    });

    return sendResult;
  });
}
