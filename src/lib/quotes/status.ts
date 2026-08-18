import "server-only";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { cancelActiveEnrollmentsForQuote } from "@/lib/follow-up/engine";
import type { LostReason } from "@prisma/client";

export async function markQuoteWon(quoteId: string, companyId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirstOrThrow({ where: { id: quoteId, companyId } });
    await tx.quote.update({ where: { id: quoteId }, data: { status: "WON", wonAt: new Date(), lostReason: null, lostAt: null } });
    await cancelActiveEnrollmentsForQuote(tx, quoteId, companyId, "quote won", userId);
    await logActivity(tx, { companyId, quoteId, userId, type: "QUOTE_WON", description: `Quote marked won (was ${quote.status}).` });
  });
}

export async function markQuoteLost(quoteId: string, companyId: string, userId: string, lostReason: LostReason, notes?: string) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirstOrThrow({ where: { id: quoteId, companyId } });
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: "LOST", lostAt: new Date(), lostReason, wonAt: null, notes: notes ?? quote.notes },
    });
    await cancelActiveEnrollmentsForQuote(tx, quoteId, companyId, "quote lost", userId);
    await logActivity(tx, {
      companyId,
      quoteId,
      userId,
      type: "QUOTE_LOST",
      description: `Quote marked lost: ${lostReason}.`,
      metadata: { lostReason },
    });
  });
}

export async function markQuotePostponed(quoteId: string, companyId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quoteId }, data: { status: "POSTPONED" } });
    await cancelActiveEnrollmentsForQuote(tx, quoteId, companyId, "quote postponed", userId);
    await logActivity(tx, { companyId, quoteId, userId, type: "QUOTE_POSTPONED", description: "Quote marked postponed." });
  });
}

export async function deleteQuote(quoteId: string, companyId: string) {
  await prisma.quote.findFirstOrThrow({ where: { id: quoteId, companyId } });
  await prisma.quote.delete({ where: { id: quoteId } });
}
