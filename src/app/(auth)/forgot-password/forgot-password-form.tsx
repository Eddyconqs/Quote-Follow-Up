"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/(auth)/actions";
import type { AuthFormState } from "@/app/(auth)/actions";
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

export function ForgotPasswordForm({ dict }: { dict: Dictionary }) {
  const [state, formAction] = useFormState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-foreground">{dict.auth.forgotPasswordSent}</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">{dict.common.back}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{dict.auth.email}</Label>
        <Input id="email" name="email" type="email" required maxLength={200} autoComplete="email" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton label={dict.auth.forgotPasswordButton} />

      <Button asChild variant="ghost" className="w-full">
        <Link href="/login">{dict.common.back}</Link>
      </Button>
    </form>
  );
}
