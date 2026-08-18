import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";

export default async function ForgotPasswordPage() {
  const { dict } = await getDictionary();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{dict.auth.forgotPassword}</CardTitle>
        <CardDescription>{dict.auth.forgotPasswordNote}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">{dict.common.back}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
