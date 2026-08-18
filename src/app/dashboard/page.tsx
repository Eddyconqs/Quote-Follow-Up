import Link from "next/link";
import { DollarSign, CalendarClock, AlertTriangle, MessageCircle, Trophy, TrendingUp, Wallet, PiggyBank, FileText, Plus } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getDashboardData } from "@/lib/data/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { QuoteStatusBadge } from "@/components/domain/status-badge";
import { AttentionList } from "./attention-list";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const { locale, dict } = await getDictionary();
  const data = await getDashboardData(user.companyId);
  const currency = user.company.defaultCurrency;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{dict.dashboard.title}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/customers/new">
              <Plus className="h-4 w-4" />
              {dict.dashboard.newCustomer}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/quotes/new">
              <Plus className="h-4 w-4" />
              {dict.dashboard.newQuote}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={dict.dashboard.openQuoteValue} value={formatCurrency(data.openQuoteValue, currency, locale)} icon={Wallet} />
        <MetricCard label={dict.dashboard.needsFollowUpToday} value={String(data.needsFollowUpToday)} icon={CalendarClock} />
        <MetricCard label={dict.dashboard.noFollowUpScheduled} value={String(data.noFollowUpScheduled)} icon={AlertTriangle} />
        <MetricCard label={dict.dashboard.recentReplies} value={String(data.recentReplies.length)} icon={MessageCircle} />
        <MetricCard label={dict.dashboard.wonThisMonth} value={String(data.wonThisMonthCount)} icon={Trophy} />
        <MetricCard label={dict.dashboard.wonRevenue} value={formatCurrency(data.wonThisMonthRevenue, currency, locale)} icon={DollarSign} />
        <MetricCard label={dict.dashboard.conversionRate} value={`${Math.round(data.conversionRate * 100)}%`} icon={TrendingUp} />
        <MetricCard label={dict.dashboard.averageQuoteValue} value={formatCurrency(data.averageQuoteValue, currency, locale)} icon={FileText} />
        <MetricCard
          label={dict.dashboard.potentialRevenue}
          value={formatCurrency(data.potentialRevenue, currency, locale)}
          icon={PiggyBank}
          className="sm:col-span-2"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.dashboard.attentionRequired}</CardTitle>
        </CardHeader>
        <CardContent>
          <AttentionList dict={dict} locale={locale} items={data.attention} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.dashboard.recentQuotes}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict.quotes.empty}</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentQuotes.map((quote) => (
                <li key={quote.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link href={`/dashboard/quotes/${quote.id}`} className="font-medium hover:underline">
                      {quote.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {quote.customer.firstName} {quote.customer.lastName} · {formatDate(quote.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatCurrency(quote.amount.toString(), quote.currency, locale)}</span>
                    <QuoteStatusBadge status={quote.status} label={dict.quoteStatus[quote.status]} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
