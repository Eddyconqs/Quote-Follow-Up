import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { EditQuoteForm } from "./edit-quote-form";

export default async function EditQuotePage({ params }: { params: { id: string } }) {
  const user = await requireCurrentUser();
  const { dict } = await getDictionary();

  const [quote, customers] = await Promise.all([
    prisma.quote.findFirst({ where: { id: params.id, companyId: user.companyId } }),
    prisma.customer.findMany({ where: { companyId: user.companyId, deletedAt: null }, orderBy: { firstName: "asc" } }),
  ]);

  if (!quote) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{dict.quoteForm.editTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditQuoteForm dict={dict} quote={quote} customers={customers} />
        </CardContent>
      </Card>
    </div>
  );
}
