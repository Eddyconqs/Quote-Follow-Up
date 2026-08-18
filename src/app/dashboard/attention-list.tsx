import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate, daysSince } from "@/lib/utils";
import type { AttentionItem } from "@/lib/data/dashboard";
import type { Dictionary, Locale } from "@/lib/i18n";

export function AttentionList({ dict, locale, items }: { dict: Dictionary; locale: Locale; items: AttentionItem[] }) {
  if (items.length === 0) {
    return <EmptyState icon={<AlertCircle className="h-6 w-6" />} title={dict.dashboard.noAttention} className="py-10" />;
  }

  return (
    <ul className="divide-y divide-border">
      {items.map(({ quote, reason }) => (
        <li key={quote.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{quote.title}</p>
              <Badge variant="warning">{dict.attentionReasons[reason]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {quote.customer.firstName} {quote.customer.lastName} · {formatCurrency(quote.amount.toString(), quote.currency, locale)} ·{" "}
              {daysSince(quote.quoteDate)} {locale === "fr" ? "jours" : "days"}
            </p>
            {quote.nextFollowUpAt && (
              <p className="text-xs text-muted-foreground">
                {dict.quoteDetail.nextFollowUp}: {formatDate(quote.nextFollowUpAt, locale)}
              </p>
            )}
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/quotes/${quote.id}`}>{dict.common.view}</Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
