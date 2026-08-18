import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyProfileForm } from "./company-profile-form";
import { SequenceEditor } from "./sequence-editor";
import { UserProfileForm } from "./user-profile-form";
import { DangerZone } from "./danger-zone";
import { ProvidersCard } from "./providers-card";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const { locale, dict } = await getDictionary();

  const sequences = await prisma.followUpSequence.findMany({
    where: { companyId: user.companyId },
    include: { steps: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.settings.title}</h1>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">{dict.settings.companyProfile}</TabsTrigger>
          <TabsTrigger value="sequences">{dict.settings.followUpSequences}</TabsTrigger>
          <TabsTrigger value="profile">{dict.settings.userProfile}</TabsTrigger>
          <TabsTrigger value="data">{dict.settings.dataExport}</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{dict.settings.companyProfile}</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyProfileForm dict={dict} company={user.company} locale={locale} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Email / SMS / AI</CardTitle>
            </CardHeader>
            <CardContent>
              <ProvidersCard dict={dict} locale={locale} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequences" className="space-y-6">
          {sequences.map((sequence) => (
            <Card key={sequence.id}>
              <CardContent className="pt-6">
                <SequenceEditor dict={dict} sequence={sequence} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{dict.settings.userProfile}</CardTitle>
            </CardHeader>
            <CardContent>
              <UserProfileForm dict={dict} user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{dict.settings.dataExport}</CardTitle>
              <CardDescription>{dict.settings.dataExportDesc}</CardDescription>
            </CardHeader>
          </Card>
          <DangerZone dict={dict} companyName={user.company.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
