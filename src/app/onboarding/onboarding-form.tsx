"use client";

import { useFormState, useFormStatus } from "react-dom";
import { completeOnboardingAction, type OnboardingFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUSINESS_TYPES, IANA_TIME_ZONES } from "@/lib/validation/shared";
import type { Dictionary } from "@/lib/i18n";

const initialState: OnboardingFormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function OnboardingForm({ dict, companyName, defaultLanguage }: { dict: Dictionary; companyName: string; defaultLanguage: "FR" | "EN" }) {
  const [state, formAction] = useFormState(completeOnboardingAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{dict.onboarding.companyName}</Label>
        <Input id="name" name="name" required defaultValue={companyName} maxLength={160} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="businessType">{dict.onboarding.businessType}</Label>
        <Select name="businessType" defaultValue="OTHER">
          <SelectTrigger id="businessType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {dict.serviceTypes[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">{dict.onboarding.email}</Label>
          <Input id="email" name="email" type="email" maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{dict.onboarding.phone}</Label>
          <Input id="phone" name="phone" type="tel" maxLength={20} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="defaultLanguage">{dict.onboarding.preferredLanguage}</Label>
          <Select name="defaultLanguage" defaultValue={defaultLanguage}>
            <SelectTrigger id="defaultLanguage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FR">{dict.common.french}</SelectItem>
              <SelectItem value="EN">{dict.common.english}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="defaultCurrency">{dict.onboarding.currency}</Label>
          <Select name="defaultCurrency" defaultValue="CAD">
            <SelectTrigger id="defaultCurrency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CAD">CAD</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="timeZone">{dict.onboarding.timeZone}</Label>
        <Select name="timeZone" defaultValue="America/Toronto">
          <SelectTrigger id="timeZone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IANA_TIME_ZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton label={dict.onboarding.submit} />
    </form>
  );
}
