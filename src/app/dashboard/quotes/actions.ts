"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { quoteSchema } from "@/lib/validation/quote";
import { logActivity } from "@/lib/activity";
import { activateFollowUp } from "@/lib/follow-up/engine";

export type QuoteFormState = { error?: string };

export async function createQuoteAction(_prev: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  const user = await requireCurrentUser();

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

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const intent = formData.get("intent") === "activate" ? "activate" : "draft";
  const sequenceId = (formData.get("sequenceId") as string) || undefined;

  const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;

  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.quote.create({
      data: {
        ...parsed.data,
        companyId: user.companyId,
        quoteNumber,
        status: "SENT",
      },
    });
    await logActivity(tx, {
      companyId: user.companyId,
      quoteId: created.id,
      userId: user.id,
      type: "QUOTE_CREATED",
      description: `Quote "${created.title}" created.`,
    });
    await tx.customer.update({ where: { id: created.customerId }, data: { lastInteractionAt: new Date() } });
    return created;
  });

  if (intent === "activate") {
    try {
      await activateFollowUp(quote.id, user.companyId, sequenceId, user.id);
    } catch {
      // Quote is still created even if activation fails (e.g. sequence has no steps); user can retry from the detail page.
    }
  }

  revalidatePath("/dashboard/quotes");
  redirect(`/dashboard/quotes/${quote.id}`);
}
