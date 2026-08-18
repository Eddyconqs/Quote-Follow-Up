import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { CustomerForm } from "../customer-form";
import { createCustomerAction } from "../actions";

export default async function NewCustomerPage() {
  const { dict } = await getDictionary();

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{dict.customers.newCustomer}</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm dict={dict} action={createCustomerAction} />
        </CardContent>
      </Card>
    </div>
  );
}
