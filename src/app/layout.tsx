import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackQuo — Ne laissez plus vos soumissions sans suivi",
  description:
    "Suivi automatique des soumissions et récupération de revenu pour les entreprises de services du Québec.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getDictionary();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
