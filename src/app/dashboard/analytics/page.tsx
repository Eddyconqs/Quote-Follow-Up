import { FileText, Trophy, XCircle, TrendingUp, Wallet, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getAnalyticsData } from "@/lib/data/analytics";
import { getDashboardData } from "@/lib/data/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { formatCurrency } from "@/lib/utils";
import { AnalyticsFilters } from "./analytics-filters";

export default async function AnalyticsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const user = await requireCurrentUser();
  const { locale, dict } = await getDictionary();

  const filters = {
    from: searchParams.from ? new Date(searchParams.from) : undefined,
    to: searchParams.to ? new Date(searchParams.to) : undefined,
    serviceType: searchParams.serviceType,
  };

  const [data, dashboard] = await Promise.all([getAnalyticsData(user.companyId, filters), getDashboardData(user.companyId)]);
  const currency = user.company.defaultCurrency;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.analytics.title}</h1>

      <AnalyticsFilters dict={dict} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={dict.analytics.quotesSent} value={String(data.quotesSent)} icon={FileText} />
        <MetricCard label={dict.analytics.quotesWon} value={String(data.quotesWon)} icon={Trophy} />
        <MetricCard label={dict.analytics.quotesLost} value={String(data.quotesLost)} icon={XCircle} />
        <MetricCard label={dict.analytics.conversionRate} value={`${Math.round(data.conversionRate * 100)}%`} icon={TrendingUp} />
        <MetricCard label={dict.analytics.openQuoteValue} value={formatCurrency(data.openQuoteValue, currency, locale)} icon={Wallet} />
        <MetricCard label={dict.analytics.wonRevenue} value={formatCurrency(data.wonRevenue, currency, locale)} icon={DollarSign} />
        <MetricCard
          label={dict.analytics.avgTimeToDecision}
          value={locale === "fr" ? `${data.avgTimeToDecisionDays.toFixed(1)} jours` : `${data.avgTimeToDecisionDays.toFixed(1)} days`}
          icon={Clock}
        />
        <MetricCard label={dict.analytics.needingAttention} value={String(dashboard.attention.length)} icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.lostReasonBreakdown}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.lostReasonBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-2">
                {data.lostReasonBreakdown.map(({ reason, count }) => (
                  <li key={reason} className="flex items-center justify-between text-sm">
                    <span>{dict.lostReason[reason]}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.analytics.followUpPerformance}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.followUpPerformance.map((row) => (
                <li key={row.channel} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dict.messageChannel[row.channel as keyof typeof dict.messageChannel]}</span>
                    <span className="text-muted-foreground">{Math.round(row.replyRate * 100)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.sent} {locale === "fr" ? "envoyés" : "sent"} · {row.replied} {locale === "fr" ? "répondus" : "replied"} · {row.failed}{" "}
                    {locale === "fr" ? "échoués" : "failed"}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
