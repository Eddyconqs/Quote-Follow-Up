import Link from "next/link";
import { ArrowRight, Mail, MessageCircleQuestion, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { getDictionary } from "@/lib/i18n";
import { DemoDialogTrigger } from "./demo-dialog";

export default async function LandingPage() {
  const { locale, dict } = await getDictionary();

  const benefits = [
    { icon: Mail, title: dict.landing.benefit1Title, body: dict.landing.benefit1Body },
    { icon: MessageCircleQuestion, title: dict.landing.benefit2Title, body: dict.landing.benefit2Body },
    { icon: TrendingUp, title: dict.landing.benefit3Title, body: dict.landing.benefit3Body },
  ];

  const steps = [dict.landing.step1, dict.landing.step2, dict.landing.step3];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <span className="text-lg font-semibold tracking-tight text-primary">{dict.common.appName}</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">{dict.auth.loginButton}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">{dict.landing.ctaPrimary}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-secondary/30">
        <div className="container flex flex-col items-center gap-6 py-20 text-center">
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {dict.landing.headline}
          </h1>
          <p className="max-w-2xl text-balance text-lg text-muted-foreground">{dict.landing.subheadline}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                {dict.landing.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <DemoDialogTrigger dict={dict} />
          </div>
          <p className="text-sm text-muted-foreground">{dict.landing.notReplace}</p>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {benefits.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="container py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight">{dict.landing.howItWorksTitle}</h2>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">{dict.landing.socialProofTitle}</h2>
          <p className="text-sm text-muted-foreground">{dict.landing.socialProofBody}</p>
        </div>
      </section>

      <section className="border-t border-border bg-primary">
        <div className="container flex flex-col items-center gap-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-primary-foreground">{dict.landing.headline}</h2>
          <Button asChild size="lg" variant="secondary">
            <Link href="/signup">
              {dict.landing.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="container flex flex-col items-center justify-between gap-3 py-8 text-sm text-muted-foreground sm:flex-row">
        <span>{dict.common.appName}</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:underline">
            {locale === "fr" ? "Confidentialité" : "Privacy"}
          </Link>
          <Link href="/terms" className="hover:underline">
            {locale === "fr" ? "Conditions" : "Terms"}
          </Link>
        </div>
        <span>
          © {new Date().getFullYear()} {dict.common.appName}. {dict.landing.footerRights}
        </span>
      </footer>
    </div>
  );
}
