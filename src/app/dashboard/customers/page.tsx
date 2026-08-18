import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { CustomerRowActions } from "./customer-row-actions";

export default async function CustomersPage() {
  const user = await requireCurrentUser();
  const { dict } = await getDictionary();

  const customers = await prisma.customer.findMany({
    where: { companyId: user.companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { quotes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{dict.customers.title}</h1>
        <Button asChild size="sm">
          <Link href="/dashboard/customers/new">
            <Plus className="h-4 w-4" />
            {dict.customers.newCustomer}
          </Link>
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={dict.customers.empty}
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/customers/new">{dict.customers.newCustomer}</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dict.customers.firstName}</TableHead>
              <TableHead>{dict.customers.email}</TableHead>
              <TableHead>{dict.customers.phone}</TableHead>
              <TableHead>{dict.customers.preferredLanguage}</TableHead>
              <TableHead>{dict.quotes.title}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  {customer.firstName} {customer.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">{customer.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{customer.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{customer.preferredLanguage}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{customer._count.quotes}</TableCell>
                <TableCell>
                  <CustomerRowActions dict={dict} customerId={customer.id} customerName={`${customer.firstName} ${customer.lastName}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
