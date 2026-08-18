import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  const { dict } = await getDictionary();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{dict.auth.forgotPasswordTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm dict={dict} />
      </CardContent>
    </Card>
  );
}
