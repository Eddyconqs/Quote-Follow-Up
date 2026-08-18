import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { QuoteForm } from "./quote-form";

export default async function NewQuotePage() {
  const user = await requireCurrentUser();
  const { dict } = await getDictionary();

  const [customers, sequences] = await Promise.all([
    prisma.customer.findMany({ where: { companyId: user.companyId, deletedAt: null }, orderBy: { firstName: "asc" } }),
    prisma.followUpSequence.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{dict.quoteForm.newTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteForm dict={dict} customers={customers} sequences={sequences} companyDefaultLanguage={user.company.defaultLanguage} />
        </CardContent>
      </Card>
    </div>
  );
}
