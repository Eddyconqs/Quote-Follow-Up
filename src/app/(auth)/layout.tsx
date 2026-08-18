import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getDictionary();

  return (
    <div className="flex min-h-screen flex-col bg-secondary/40">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
          {dict.common.appName}
        </Link>
        <LanguageSwitcher locale={locale} />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">{children}</main>
    </div>
  );
}
