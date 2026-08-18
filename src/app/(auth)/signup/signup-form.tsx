"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { signupAction, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Dictionary, Locale } from "@/lib/i18n";

const initialState: AuthFormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function SignupForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [state, formAction] = useFormState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="companyName">{dict.onboarding.companyName}</Label>
        <Input id="companyName" name="companyName" required maxLength={160} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">{dict.auth.name}</Label>
        <Input id="name" name="name" required maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{dict.auth.email}</Label>
        <Input id="email" name="email" type="email" required maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{dict.auth.password}</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
        <p className="text-xs text-muted-foreground">8+ caractères, une majuscule, une minuscule, un chiffre.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="preferredLanguage">{dict.onboarding.preferredLanguage}</Label>
        <Select name="preferredLanguage" defaultValue="FR">
          <SelectTrigger id="preferredLanguage">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FR">{dict.common.french}</SelectItem>
            <SelectItem value="EN">{dict.common.english}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <p className="text-xs text-muted-foreground">
        {locale === "fr" ? (
          <>
            En créant un compte, vous acceptez nos{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              politique de confidentialité
            </Link>
            .
          </>
        ) : (
          <>
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </>
        )}
      </p>

      <SubmitButton label={dict.auth.signupButton} />

      <p className="text-center text-sm text-muted-foreground">
        {dict.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {dict.auth.loginLink}
        </Link>
      </p>
    </form>
  );
}
