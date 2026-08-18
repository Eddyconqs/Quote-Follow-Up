import "server-only";
import { prisma } from "@/lib/prisma";
import { daysSince } from "@/lib/utils";
import type { Quote, Customer, CustomerReply } from "@prisma/client";

const OPEN_STATUSES = ["SENT", "FOLLOW_UP_SCHEDULED", "CUSTOMER_REPLIED", "PAUSED", "POSTPONED"] as const;
const ACTIVE_FOLLOW_UP_STATUSES = ["ACTIVE", "SCHEDULED"] as const;

export type AttentionReason =
  | "CUSTOMER_QUESTION"
  | "PRICE_OBJECTION"
  | "FOLLOW_UP_OVERDUE"
  | "NO_FOLLOW_UP_SCHEDULED"
  | "EXPIRES_SOON"
  | "OPEN_TOO_LONG";

export interface AttentionItem {
  quote: Quote & { customer: Customer };
  reason: AttentionReason;
  lastReplyClassification: CustomerReply["classification"] | null;
}

export async function getDashboardData(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [openQuotes, activeFollowUpQuotes, wonThisMonth, wonAllTime, lostAllTime, allQuotesAggregate, recentQuotes, recentReplies, needsFollowUpToday] =
    await Promise.all([
      prisma.quote.findMany({ where: { companyId, status: { in: [...OPEN_STATUSES] } }, include: { customer: true } }),
      prisma.quote.aggregate({
        where: { companyId, status: { in: [...OPEN_STATUSES] }, followUpStatus: { in: [...ACTIVE_FOLLOW_UP_STATUSES] } },
        _sum: { amount: true },
      }),
      prisma.quote.aggregate({
        where: { companyId, status: "WON", wonAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.quote.count({ where: { companyId, status: "WON" } }),
      prisma.quote.count({ where: { companyId, status: "LOST" } }),
      prisma.quote.aggregate({ where: { companyId }, _avg: { amount: true } }),
      prisma.quote.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 8, include: { customer: true } }),
      prisma.customerReply.findMany({
        where: { companyId, createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { customer: true, quote: true },
      }),
      prisma.quote.count({
        where: { companyId, followUpStatus: "ACTIVE", nextFollowUpAt: { lt: endOfToday } },
      }),
    ]);

  const openQuoteValue = openQuotes.reduce((sum, q) => sum + Number(q.amount), 0);
  const potentialRevenue = Number(activeFollowUpQuotes._sum.amount ?? 0);
  const noFollowUpScheduled = openQuotes.filter((q) => q.followUpStatus === "NONE").length;
  const conversionRate = wonAllTime + lostAllTime > 0 ? wonAllTime / (wonAllTime + lostAllTime) : 0;

  const latestReplyByQuote = new Map<string, CustomerReply["classification"]>();
  for (const reply of recentReplies) {
    if (!latestReplyByQuote.has(reply.quoteId)) latestReplyByQuote.set(reply.quoteId, reply.classification);
  }

  const attention: AttentionItem[] = [];
  for (const quote of openQuotes) {
    const classification = latestReplyByQuote.get(quote.id) ?? null;
    let reason: AttentionReason | null = null;

    if (quote.status === "CUSTOMER_REPLIED" && classification === "PRICE_OBJECTION") reason = "PRICE_OBJECTION";
    else if (quote.status === "CUSTOMER_REPLIED" && classification === "QUESTION") reason = "CUSTOMER_QUESTION";
    else if (quote.followUpStatus === "ACTIVE" && quote.nextFollowUpAt && quote.nextFollowUpAt < now) reason = "FOLLOW_UP_OVERDUE";
    else if (quote.followUpStatus === "NONE") reason = "NO_FOLLOW_UP_SCHEDULED";
    else if (quote.expirationDate && quote.expirationDate > now && quote.expirationDate.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000)
      reason = "EXPIRES_SOON";
    else if (daysSince(quote.quoteDate) > 14) reason = "OPEN_TOO_LONG";

    if (reason) attention.push({ quote, reason, lastReplyClassification: classification });
  }

  return {
    openQuoteValue,
    potentialRevenue,
    noFollowUpScheduled,
    needsFollowUpToday,
    wonThisMonthCount: wonThisMonth._count,
    wonThisMonthRevenue: Number(wonThisMonth._sum.amount ?? 0),
    conversionRate,
    averageQuoteValue: Number(allQuotesAggregate._avg.amount ?? 0),
    recentQuotes,
    recentReplies,
    attention: attention.slice(0, 10),
  };
}
