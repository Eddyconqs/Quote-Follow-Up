import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, LostReason } from "@prisma/client";

export interface AnalyticsFilters {
  from?: Date;
  to?: Date;
  serviceType?: string;
}

export async function getAnalyticsData(companyId: string, filters: AnalyticsFilters) {
  const where: Prisma.QuoteWhereInput = {
    companyId,
    ...(filters.serviceType ? { serviceType: filters.serviceType } : {}),
    ...(filters.from || filters.to
      ? {
          quoteDate: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const [totalSent, wonQuotes, lostQuotes, openAggregate, lostReasonGroups, messagesByChannel, quotes] = await Promise.all([
    prisma.quote.count({ where: { ...where, status: { not: "DRAFT" } } }),
    prisma.quote.findMany({ where: { ...where, status: "WON" }, select: { amount: true, quoteDate: true, wonAt: true } }),
    prisma.quote.findMany({ where: { ...where, status: "LOST" }, select: { quoteDate: true, lostAt: true, lostReason: true } }),
    prisma.quote.aggregate({
      where: { ...where, status: { in: ["SENT", "FOLLOW_UP_SCHEDULED", "CUSTOMER_REPLIED", "PAUSED", "POSTPONED"] } },
      _sum: { amount: true },
    }),
    prisma.quote.groupBy({ by: ["lostReason"], where: { ...where, status: "LOST" }, _count: true }),
    prisma.message.groupBy({
      by: ["channel", "status"],
      where: { companyId, direction: "OUTBOUND" },
      _count: true,
    }),
    prisma.quote.count({ where }),
  ]);

  const wonRevenue = wonQuotes.reduce((sum, q) => sum + Number(q.amount), 0);
  const conversionRate = wonQuotes.length + lostQuotes.length > 0 ? wonQuotes.length / (wonQuotes.length + lostQuotes.length) : 0;

  const decisionDurations = [...wonQuotes.map((q) => (q.wonAt ? { start: q.quoteDate, end: q.wonAt } : null)), ...lostQuotes.map((q) => (q.lostAt ? { start: q.quoteDate, end: q.lostAt } : null))].filter(
    (v): v is { start: Date; end: Date } => v !== null
  );
  const avgTimeToDecisionDays =
    decisionDurations.length > 0
      ? decisionDurations.reduce((sum, d) => sum + (d.end.getTime() - d.start.getTime()) / (1000 * 60 * 60 * 24), 0) / decisionDurations.length
      : 0;

  const lostReasonBreakdown = lostReasonGroups
    .filter((g) => g.lostReason)
    .map((g) => ({ reason: g.lostReason as LostReason, count: g._count }));

  const followUpPerformance = ["EMAIL", "SMS", "MANUAL_TASK"].map((channel) => {
    const rows = messagesByChannel.filter((m) => m.channel === channel);
    const sent = rows.filter((r) => ["SENT", "DELIVERED", "REPLIED"].includes(r.status)).reduce((s, r) => s + r._count, 0);
    const replied = rows.filter((r) => r.status === "REPLIED").reduce((s, r) => s + r._count, 0);
    const failed = rows.filter((r) => r.status === "FAILED").reduce((s, r) => s + r._count, 0);
    return { channel, sent, replied, failed, replyRate: sent > 0 ? replied / sent : 0 };
  });

  return {
    quotesSent: totalSent,
    quotesWon: wonQuotes.length,
    quotesLost: lostQuotes.length,
    conversionRate,
    openQuoteValue: Number(openAggregate._sum.amount ?? 0),
    wonRevenue,
    avgTimeToDecisionDays,
    quotesInScope: quotes,
    lostReasonBreakdown,
    followUpPerformance,
  };
}
