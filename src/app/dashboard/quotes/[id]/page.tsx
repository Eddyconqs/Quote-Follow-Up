import { notFound } from "next/navigation";
import { Mail, Phone, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QuoteStatusBadge, FollowUpStatusBadge } from "@/components/domain/status-badge";
import { formatCurrency, formatDate, daysSince, initials } from "@/lib/utils";
import { QuoteActions } from "./quote-actions";
import { ManualMessageDialog } from "./manual-message-dialog";
import { SimulateReplyDialog } from "./simulate-reply-dialog";
import { MessageTimeline } from "./message-timeline";
import { ActivityTimeline } from "./activity-timeline";
import { JobHandoffPanel } from "./job-handoff-panel";

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const user = await requireCurrentUser();
  const { locale, dict } = await getDictionary();

  const quote = await prisma.quote.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: {
      customer: true,
      assignedUser: true,
      messages: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
      followUpEnrollments: { orderBy: { createdAt: "desc" } },
      jobHandoffs: true,
    },
  });

  if (!quote) notFound();

  const [sequences, users] = await Promise.all([
    prisma.followUpSequence.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { companyId: user.companyId }, orderBy: { name: "asc" } }),
  ]);

  const activeEnrollment = quote.followUpEnrollments.find((e) => e.status === "ACTIVE" || e.status === "PAUSED") ?? null;
  const sentMessage = quote.messages.find((m) => m.direction === "OUTBOUND" && m.sentAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{quote.title}</h1>
            <QuoteStatusBadge status={quote.status} label={dict.quoteStatus[quote.status]} />
            <FollowUpStatusBadge status={quote.followUpStatus} label={dict.followUpStatus[quote.followUpStatus]} />
          </div>
          <p className="text-sm text-muted-foreground">
            {quote.quoteNumber} · {dict.serviceTypes[quote.serviceType as keyof typeof dict.serviceTypes] ?? quote.serviceType}
          </p>
        </div>
        <p className="text-2xl font-semibold">{formatCurrency(quote.amount.toString(), quote.currency, locale)}</p>
      </div>

      <QuoteActions
        dict={dict}
        quoteId={quote.id}
        status={quote.status}
        followUpStatus={quote.followUpStatus}
        activeEnrollmentId={activeEnrollment?.id ?? null}
        sequences={sequences}
        customerLanguage={quote.customer.preferredLanguage}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{dict.quoteDetail.customerProfile}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initials(quote.customer.firstName, quote.customer.lastName)}
                </div>
                <div>
                  <p className="font-medium">
                    {quote.customer.firstName} {quote.customer.lastName}
                  </p>
                  <Badge variant="outline">{quote.customer.preferredLanguage}</Badge>
                </div>
              </div>
              {quote.customer.email && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" /> {quote.customer.email}
                </p>
              )}
              {quote.customer.phone && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" /> {quote.customer.phone}
                </p>
              )}
              {quote.customer.address && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {quote.customer.address}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Badge variant={quote.customer.emailConsent ? "success" : "muted"}>{dict.customers.emailConsent}</Badge>
                <Badge variant={quote.customer.smsConsent ? "success" : "muted"}>{dict.customers.smsConsent}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.quoteDetail.quoteInformation}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{dict.quotes.quoteDate}</span>
                <span>{formatDate(quote.quoteDate, locale)}</span>
              </div>
              {quote.expirationDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{dict.quotes.expirationDate}</span>
                  <span>{formatDate(quote.expirationDate, locale)}</span>
                </div>
              )}
              {sentMessage?.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{dict.quoteDetail.daysSinceSent}</span>
                  <span>{daysSince(sentMessage.sentAt)}</span>
                </div>
              )}
              {quote.nextFollowUpAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{dict.quoteDetail.nextFollowUp}</span>
                  <span>{formatDate(quote.nextFollowUpAt, locale)}</span>
                </div>
              )}
              {quote.assignedUser && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{dict.jobHandoffForm.assignedUser}</span>
                  <span>{quote.assignedUser.name}</span>
                </div>
              )}
              {quote.status === "LOST" && quote.lostReason && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{dict.quoteDetail.lostReasonLabel}</span>
                  <span>{dict.lostReason[quote.lostReason]}</span>
                </div>
              )}
              {quote.description && (
                <>
                  <Separator className="my-2" />
                  <p className="whitespace-pre-wrap text-muted-foreground">{quote.description}</p>
                </>
              )}
              {quote.notes && (
                <>
                  <Separator className="my-2" />
                  <p className="whitespace-pre-wrap text-muted-foreground">{quote.notes}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.quoteDetail.jobHandoff}</CardTitle>
            </CardHeader>
            <CardContent>
              <JobHandoffPanel
                dict={dict}
                locale={locale}
                quoteId={quote.id}
                quoteStatus={quote.status}
                defaultServiceType={quote.serviceType}
                handoff={quote.jobHandoffs[0] ?? null}
                users={users}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{dict.quoteDetail.messageTimeline}</CardTitle>
              <div className="flex gap-2">
                <ManualMessageDialog dict={dict} quoteId={quote.id} />
                <SimulateReplyDialog dict={dict} quoteId={quote.id} />
              </div>
            </CardHeader>
            <CardContent>
              <MessageTimeline dict={dict} locale={locale} quoteId={quote.id} messages={quote.messages} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.quoteDetail.activityTimeline}</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline dict={dict} locale={locale} activities={quote.activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
