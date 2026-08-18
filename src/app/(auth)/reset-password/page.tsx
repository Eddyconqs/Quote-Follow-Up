import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { verifyPasswordResetToken } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const { dict } = await getDictionary();
  const token = searchParams.token ?? "";
  const valid = token ? await verifyPasswordResetToken(token) : null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{dict.auth.resetPasswordTitle}</CardTitle>
        {!valid && <CardDescription className="text-destructive">{dict.auth.resetInvalidToken}</CardDescription>}
      </CardHeader>
      <CardContent>
        {valid ? (
          <ResetPasswordForm dict={dict} token={token} />
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">{dict.auth.forgotPasswordTitle}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
