import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  const { dict } = await getDictionary();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{dict.onboarding.title}</CardTitle>
          <CardDescription>{dict.onboarding.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm dict={dict} companyName={user.company.name} defaultLanguage={user.preferredLanguage} />
        </CardContent>
      </Card>
    </div>
  );
}
