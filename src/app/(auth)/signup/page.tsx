import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const { dict, locale } = await getDictionary();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{dict.auth.signupTitle}</CardTitle>
        <CardDescription>{dict.landing.subheadline}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm dict={dict} locale={locale} />
      </CardContent>
    </Card>
  );
}
