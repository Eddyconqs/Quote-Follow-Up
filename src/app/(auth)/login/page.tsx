import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: { reset?: string } }) {
  const { dict } = await getDictionary();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{dict.auth.loginTitle}</CardTitle>
        {searchParams.reset === "success" && (
          <CardDescription className="text-success">{dict.auth.resetPasswordSuccess}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <LoginForm dict={dict} />
      </CardContent>
    </Card>
  );
}
