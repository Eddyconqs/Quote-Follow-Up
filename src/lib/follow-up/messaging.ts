import "server-only";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { sendViaChannel } from "@/lib/providers/dispatch";
import { getAiProvider } from "@/lib/providers/ai";
import { cancelActiveEnrollmentsForQuote } from "@/lib/follow-up/engine";

export async function sendManualMessage(
  input: { quoteId: string; channel: "EMAIL" | "SMS" | "MANUAL_TASK"; subject?: string; body: string },
  companyId: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirstOrThrow({ where: { id: input.quoteId, companyId }, include: { customer: true, company: true } });

    if (input.channel === "MANUAL_TASK") {
      const message = await tx.message.create({
        data: {
          companyId,
          quoteId: quote.id,
          customerId: quote.customerId,
          channel: "MANUAL_TASK",
          direction: "OUTBOUND",
          status: "SENT",
          subject: input.subject,
          body: input.body,
          sentAt: new Date(),
        },
      });
      await logActivity(tx, { companyId, quoteId: quote.id, userId, type: "MESSAGE_SENT", description: "Manual task logged.", metadata: { messageId: message.id } });
      return message;
    }

    const hasConsent = input.channel === "EMAIL" ? quote.customer.emailConsent && !!quote.customer.email : quote.customer.smsConsent && !!quote.customer.phone;
    if (!hasConsent) {
      throw new Error("MISSING_CONSENT");
    }

    const message = await tx.message.create({
      data: {
        companyId,
        quoteId: quote.id,
        customerId: quote.customerId,
        channel: input.channel,
        direction: "OUTBOUND",
        status: "SCHEDULED",
        subject: input.subject,
        body: input.body,
      },
    });

    const channel = input.channel;
    const sendResult = await sendViaChannel(channel, {
      to: channel === "EMAIL" ? quote.customer.email! : quote.customer.phone!,
      subject: input.subject ?? "",
      body: input.body,
      language: quote.language,
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
      quoteId: quote.id,
      userId,
      type: sendResult.status === "sent" ? "MESSAGE_SENT" : "MESSAGE_FAILED",
      description: sendResult.status === "sent" ? "Manual message sent." : "Manual message failed to send.",
      metadata: { messageId: message.id },
    });

    return message;
  });
}

/**
 * Records an inbound customer reply (there is no real inbound email/SMS webhook in
 * the MVP, so this is invoked from a "simulate reply" dev action). Classifies the
 * reply with the AI provider, stops any active follow-up, and flags the quote.
 */
export async function recordCustomerReply(
  input: { quoteId: string; originalMessageId?: string; body: string },
  companyId: string,
  userId?: string
) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirstOrThrow({ where: { id: input.quoteId, companyId }, include: { customer: true } });

    const original = input.originalMessageId
      ? await tx.message.findFirst({ where: { id: input.originalMessageId, quoteId: quote.id, companyId } })
      : await tx.message.findFirst({ where: { quoteId: quote.id, companyId, direction: "OUTBOUND" }, orderBy: { createdAt: "desc" } });

    const inboundMessage = await tx.message.create({
      data: {
        companyId,
        quoteId: quote.id,
        customerId: quote.customerId,
        channel: original?.channel ?? "EMAIL",
        direction: "INBOUND",
        status: "REPLIED",
        body: input.body,
        repliedAt: new Date(),
      },
    });

    if (original) {
      await tx.message.update({ where: { id: original.id }, data: { status: "REPLIED", repliedAt: new Date() } });
    }

    const ai = getAiProvider();
    const classification = await ai.classifyReply(input.body, quote.customer.preferredLanguage);

    const reply = await tx.customerReply.create({
      data: {
        companyId,
        quoteId: quote.id,
        customerId: quote.customerId,
        messageId: inboundMessage.id,
        body: input.body,
        classification: classification.classification,
        confidence: classification.confidence,
        requiresHumanAttention: classification.requiresHumanAttention,
      },
    });

    if (!["WON", "LOST"].includes(quote.status)) {
      await tx.quote.update({ where: { id: quote.id }, data: { status: "CUSTOMER_REPLIED" } });
    }

    await cancelActiveEnrollmentsForQuote(tx, quote.id, companyId, "customer replied", userId);

    await logActivity(tx, {
      companyId,
      quoteId: quote.id,
      userId,
      type: "CUSTOMER_REPLIED",
      description: `Customer replied — classified as ${classification.classification}.`,
      metadata: { replyId: reply.id, classification: classification.classification },
    });

    return reply;
  });
}
