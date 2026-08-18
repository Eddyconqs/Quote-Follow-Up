import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import type { Prisma, QuoteStatus, FollowUpStatus, Language } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { QuoteStatusBadge, FollowUpStatusBadge } from "@/components/domain/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QuoteFilters } from "./quote-filters";

const SORT_FIELDS = ["quoteDate", "amount", "nextFollowUpAt", "status"] as const;

export default async function QuotesPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const user = await requireCurrentUser();
  const { locale, dict } = await getDictionary();

  const { q, status, followUpStatus, language, serviceType, from, to } = searchParams;
  const sort = SORT_FIELDS.includes(searchParams.sort as (typeof SORT_FIELDS)[number]) ? (searchParams.sort as (typeof SORT_FIELDS)[number]) : "quoteDate";
  const dir = searchParams.dir === "asc" ? "asc" : "desc";

  const where: Prisma.QuoteWhereInput = {
    companyId: user.companyId,
    ...(status ? { status: status as QuoteStatus } : {}),
    ...(followUpStatus ? { followUpStatus: followUpStatus as FollowUpStatus } : {}),
    ...(language ? { language: language as Language } : {}),
    ...(serviceType ? { serviceType } : {}),
    ...(from || to
      ? {
          quoteDate: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { quoteNumber: { contains: q, mode: "insensitive" } },
            { customer: { firstName: { contains: q, mode: "insensitive" } } },
            { customer: { lastName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.QuoteOrderByWithRelationInput =
    sort === "amount"
      ? { amount: dir }
      : sort === "nextFollowUpAt"
        ? { nextFollowUpAt: dir }
        : sort === "status"
          ? { status: dir }
          : { quoteDate: dir };

  const quotes = await prisma.quote.findMany({
    where,
    include: { customer: true },
    orderBy,
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{dict.quotes.title}</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/quotes/new">
            <Plus className="h-4 w-4" />
            {dict.quotes.newQuote}
          </Link>
        </Button>
      </div>

      <QuoteFilters dict={dict} />

      {quotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={dict.quotes.empty}
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/quotes/new">{dict.quotes.newQuote}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.quotes.quoteNumber}</TableHead>
                  <TableHead>{dict.quotes.customer}</TableHead>
                  <TableHead>{dict.quotes.amount}</TableHead>
                  <TableHead>{dict.common.status}</TableHead>
                  <TableHead>{dict.quotes.followUpStatus}</TableHead>
                  <TableHead>{dict.quotes.nextFollowUp}</TableHead>
                  <TableHead>{dict.quotes.quoteDate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/dashboard/quotes/${quote.id}`} className="font-medium hover:underline">
                        {quote.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">{quote.quoteNumber}</div>
                    </TableCell>
                    <TableCell>
                      {quote.customer.firstName} {quote.customer.lastName}
                    </TableCell>
                    <TableCell>{formatCurrency(quote.amount.toString(), quote.currency, locale)}</TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status} label={dict.quoteStatus[quote.status]} />
                    </TableCell>
                    <TableCell>
                      <FollowUpStatusBadge status={quote.followUpStatus} label={dict.followUpStatus[quote.followUpStatus]} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {quote.nextFollowUpAt ? formatDate(quote.nextFollowUpAt, locale) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(quote.quoteDate, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {quotes.map((quote) => (
              <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`}>
                <Card>
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{quote.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quote.customer.firstName} {quote.customer.lastName}
                        </p>
                      </div>
                      <span className="font-medium">{formatCurrency(quote.amount.toString(), quote.currency, locale)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <QuoteStatusBadge status={quote.status} label={dict.quoteStatus[quote.status]} />
                      <FollowUpStatusBadge status={quote.followUpStatus} label={dict.followUpStatus[quote.followUpStatus]} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
