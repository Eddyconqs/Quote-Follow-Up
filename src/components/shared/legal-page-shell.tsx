import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import type { Locale } from "@/lib/i18n";

export function LegalPageShell({
  locale,
  title,
  updatedLabel,
  children,
}: {
  locale: Locale;
  title: string;
  updatedLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
            TrackQuo
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
      </header>
      <main className="container max-w-3xl py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{updatedLabel}</p>
        <div className="mt-8 max-w-none space-y-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mt-8 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:text-sm [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </div>
      </main>
    </div>
  );
}
