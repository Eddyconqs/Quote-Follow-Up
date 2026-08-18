"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserProfileAction, type SettingsActionState } from "./actions";
import type { Dictionary } from "@/lib/i18n";
import type { User } from "@prisma/client";

const initialState: SettingsActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function UserProfileForm({ dict, user }: { dict: Dictionary; user: User }) {
  const [state, formAction] = useFormState(updateUserProfileAction, initialState);

  useEffect(() => {
    if (state.success) toast.success(dict.settings.saved);
  }, [state.success, dict.settings.saved]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{dict.auth.name}</Label>
        <Input id="name" name="name" required defaultValue={user.name} maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label>{dict.auth.email}</Label>
        <Input value={user.email} disabled />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="preferredLanguage">{dict.onboarding.preferredLanguage}</Label>
        <Select name="preferredLanguage" defaultValue={user.preferredLanguage}>
          <SelectTrigger id="preferredLanguage" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FR">{dict.common.french}</SelectItem>
            <SelectItem value="EN">{dict.common.english}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton label={dict.common.save} />
    </form>
  );
}
