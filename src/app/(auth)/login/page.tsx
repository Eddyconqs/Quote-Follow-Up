import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const { dict } = await getDictionary();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{dict.auth.loginTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm dict={dict} />
      </CardContent>
    </Card>
  );
}
