"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n";

const initialState: AuthFormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function LoginForm({ dict }: { dict: Dictionary }) {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{dict.auth.email}</Label>
        <Input id="email" name="email" type="email" required maxLength={200} autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{dict.auth.password}</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton label={dict.auth.loginButton} />

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:underline">
          {dict.auth.forgotPassword}
        </Link>
        <Link href="/signup" className="font-medium text-primary hover:underline">
          {dict.auth.signupLink}
        </Link>
      </div>
    </form>
  );
}
