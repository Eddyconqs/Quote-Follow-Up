"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import {
  activateFollowUp,
  pauseFollowUp,
  resumeFollowUp,
  approveAndSendMessage,
  retryMessage,
} from "@/lib/follow-up/engine";
import { sendManualMessage, recordCustomerReply } from "@/lib/follow-up/messaging";
import { markQuoteWon, markQuoteLost, markQuotePostponed, deleteQuote } from "@/lib/quotes/status";
import { createJobHandoff, updateJobHandoffStatus } from "@/lib/quotes/job-handoff";
import { manualMessageSchema, simulateReplySchema, markLostSchema, jobHandoffSchema, quoteSchema } from "@/lib/validation/quote";
import type { LostReason } from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };
const OK: ActionState = { success: true };

function fail(message: string): ActionState {
  return { error: message };
}

export async function activateFollowUpAction(quoteId: string, sequenceId?: string): Promise<ActionState> {
  const user = await requireCurrentUser();
  try {
    await activateFollowUp(quoteId, user.companyId, sequenceId, user.id);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "ACTIVATION_FAILED");
  }
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  return OK;
}

export async function pauseFollowUpAction(enrollmentId: string, quoteId: string): Promise<ActionState> {
  const user = await requireCurrentUser();
  await pauseFollowUp(enrollmentId, user.companyId, user.id);
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  return OK;
}

export async function resumeFollowUpAction(enrollmentId: string, quoteId: string): Promise<ActionState> {
  const user = await requireCurrentUser();
  await resumeFollowUp(enrollmentId, user.companyId, user.id);
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  return OK;
}

export async function approveMessageAction(messageId: string, quoteId: string): Promise<ActionState> {
  const user = await requireCurrentUser();
  try {
    await approveAndSendMessage(messageId, user.companyId, user.id);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "SEND_FAILED");
  }
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  return OK;
}

export async function retryMessageAction(messageId: string, quoteId: string): Promise<ActionState> {
  const user = await requireCurrentUser();
  try {
    await retryMessage(messageId, user.companyId, user.id);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "SEND_FAILED");
  }
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  return OK;
}

export async function sendManualMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const parsed = manualMessageSchema.safeParse({
    quoteId: formData.get("quoteId"),
    channel: formData.get("channel"),
    subject: formData.get("subject") ?? "",
    body: formData.get("body"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  try {
    await sendManualMessage(parsed.data, user.companyId, user.id);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "SEND_FAILED");
  }
  revalidatePath(`/dashboard/quotes/${parsed.data.quoteId}`);
  return OK;
}

export async function simulateReplyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const parsed = simulateReplySchema.safeParse({
    quoteId: formData.get("quoteId"),
    messageId: formData.get("messageId") || undefined,
    body: formData.get("body"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  await recordCustomerReply(
    { quoteId: parsed.data.quoteId, originalMessageId: parsed.data.messageId, body: parsed.data.body },
    user.companyId,
    user.id
  );
  revalidatePath(`/dashboard/quotes/${parsed.data.quoteId}`);
  return OK;
}

export async function markWonAction(quoteId: string): Promise<ActionState> {
  const user = await requireCurrentUser();
  await markQuoteWon(quoteId, user.companyId, user.id);
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  return OK;
}

export async function markLostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const parsed = markLostSchema.safeParse({
    quoteId: formData.get("quoteId"),
    lostReason: formData.get("lostReason"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  await markQuoteLost(parsed.data.quoteId, user.companyId, user.id, parsed.data.lostReason as LostReason, parsed.data.notes);
  revalidatePath(`/dashboard/quotes/${parsed.data.quoteId}`);
  return OK;
}

export async function markPostponedAction(quoteId: string): Promise<ActionState> {
  const user = await requireCurrentUser();
  await markQuotePostponed(quoteId, user.companyId, user.id);
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  return OK;
}

export async function createJobHandoffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const parsed = jobHandoffSchema.safeParse({
    quoteId: formData.get("quoteId"),
    serviceType: formData.get("serviceType") || undefined,
    notes: formData.get("notes") ?? "",
    scheduledDate: formData.get("scheduledDate") || undefined,
    assignedUserId: formData.get("assignedUserId") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  try {
    await createJobHandoff(parsed.data, user.companyId, user.id);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "HANDOFF_FAILED");
  }
  revalidatePath(`/dashboard/quotes/${parsed.data.quoteId}`);
  return OK;
}

export async function markJobHandoffReadyAction(handoffId: string, quoteId: string): Promise<ActionState> {
  const user = await requireCurrentUser();
  await updateJobHandoffStatus(handoffId, user.companyId, user.id, "READY_FOR_SCHEDULING");
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  return OK;
}

export async function updateQuoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireCurrentUser();
  const quoteId = formData.get("quoteId") as string;

  const parsed = quoteSchema.safeParse({
    customerId: formData.get("customerId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    serviceType: formData.get("serviceType"),
    amount: formData.get("amount"),
    currency: formData.get("currency") ?? "CAD",
    language: formData.get("language"),
    quoteDate: formData.get("quoteDate"),
    expirationDate: formData.get("expirationDate") || undefined,
    notes: formData.get("notes") ?? "",
    source: formData.get("source") ?? "MANUAL",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  await prisma.$transaction(async (tx) => {
    await tx.quote.findFirstOrThrow({ where: { id: quoteId, companyId: user.companyId } });
    await tx.quote.update({ where: { id: quoteId }, data: parsed.data });
    await logActivity(tx, { companyId: user.companyId, quoteId, userId: user.id, type: "QUOTE_EDITED", description: "Quote details edited." });
  });

  redirect(`/dashboard/quotes/${quoteId}`);
}

export async function deleteQuoteAction(quoteId: string) {
  const user = await requireCurrentUser();
  await deleteQuote(quoteId, user.companyId);
  redirect("/dashboard/quotes");
}
