import type { Channel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDictionaryFor } from "@/lib/i18n";
import { isUnsubscribed } from "@/lib/compliance/consent";
import { renderTemplate } from "@/lib/templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unsubscribeAction } from "./actions";

function resolveChannel(value: string | undefined): Channel {
  return value === "SMS" ? "SMS" : "EMAIL";
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { c?: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { unsubscribeToken: params.token },
    include: { company: true },
  });

  const dict = getDictionaryFor(customer?.preferredLanguage === "EN" ? "en" : "fr");

  if (!customer) {
    return (
      <UnsubscribeShell title={dict.unsubscribe.title}>
        <p className="text-sm text-muted-foreground">{dict.unsubscribe.invalidLink}</p>
      </UnsubscribeShell>
    );
  }

  const channel = resolveChannel(searchParams.c);
  const contactValue = channel === "EMAIL" ? customer.email : customer.phone;

  if (!contactValue) {
    return (
      <UnsubscribeShell title={dict.unsubscribe.title}>
        <p className="text-sm text-muted-foreground">{dict.unsubscribe.invalidLink}</p>
      </UnsubscribeShell>
    );
  }

  const alreadyDone = await isUnsubscribed(prisma, customer.companyId, channel, contactValue);

  if (alreadyDone) {
    return (
      <UnsubscribeShell title={dict.unsubscribe.doneTitle}>
        <p className="text-sm text-muted-foreground">{dict.unsubscribe.doneDesc}</p>
      </UnsubscribeShell>
    );
  }

  const description = renderTemplate(channel === "EMAIL" ? dict.unsubscribe.emailDesc : dict.unsubscribe.smsDesc, {
    companyName: customer.company.name,
  });

  return (
    <UnsubscribeShell title={dict.unsubscribe.title}>
      <p className="text-sm text-muted-foreground">{description}</p>
      <form action={unsubscribeAction.bind(null, params.token, channel)}>
        <Button type="submit" className="mt-4 w-full">
          {dict.unsubscribe.confirm}
        </Button>
      </form>
    </UnsubscribeShell>
  );
}

function UnsubscribeShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
