"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCompanyProfileAction, type SettingsActionState } from "./actions";
import { BUSINESS_TYPES, IANA_TIME_ZONES } from "@/lib/validation/shared";
import { parseBusinessHours, type BusinessHours } from "@/lib/follow-up/business-hours";
import type { Dictionary } from "@/lib/i18n";
import type { Company } from "@prisma/client";

const initialState: SettingsActionState = {};
const DAYS = [
  { value: 0, labelFr: "Dim", labelEn: "Sun" },
  { value: 1, labelFr: "Lun", labelEn: "Mon" },
  { value: 2, labelFr: "Mar", labelEn: "Tue" },
  { value: 3, labelFr: "Mer", labelEn: "Wed" },
  { value: 4, labelFr: "Jeu", labelEn: "Thu" },
  { value: 5, labelFr: "Ven", labelEn: "Fri" },
  { value: 6, labelFr: "Sam", labelEn: "Sat" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function CompanyProfileForm({ dict, company, locale }: { dict: Dictionary; company: Company; locale: "fr" | "en" }) {
  const [state, formAction] = useFormState(updateCompanyProfileAction, initialState);
  const hours: BusinessHours = parseBusinessHours(company.businessHours);
  const [days, setDays] = useState<number[]>(hours.days);

  useEffect(() => {
    if (state.success) toast.success(dict.settings.saved);
  }, [state.success, dict.settings.saved]);

  return (
    <form action={formAction} className="space-y-4">
      {days.map((d) => (
        <input key={d} type="hidden" name="businessHoursDays" value={d} />
      ))}

      <div className="space-y-1.5">
        <Label htmlFor="name">{dict.onboarding.companyName}</Label>
        <Input id="name" name="name" required defaultValue={company.name} maxLength={160} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="businessType">{dict.onboarding.businessType}</Label>
        <Select name="businessType" defaultValue={company.businessType ?? "OTHER"}>
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
          <Input id="email" name="email" type="email" defaultValue={company.email ?? ""} maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{dict.onboarding.phone}</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={company.phone ?? ""} maxLength={20} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">{dict.customers.address}</Label>
        <Input id="address" name="address" defaultValue={company.address ?? ""} maxLength={300} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="defaultLanguage">{dict.onboarding.preferredLanguage}</Label>
          <Select name="defaultLanguage" defaultValue={company.defaultLanguage}>
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
          <Select name="defaultCurrency" defaultValue={company.defaultCurrency}>
            <SelectTrigger id="defaultCurrency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CAD">CAD</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timeZone">{dict.onboarding.timeZone}</Label>
          <Select name="timeZone" defaultValue={company.timeZone}>
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
      </div>

      <div className="space-y-2 rounded-md border border-border p-3">
        <p className="text-sm font-medium">{dict.settings.businessHours}</p>
        <p className="text-xs text-muted-foreground">{dict.settings.businessHoursDesc}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="businessHoursStart">{dict.settings.startHour}</Label>
            <Input id="businessHoursStart" name="businessHoursStart" type="number" min={0} max={23} defaultValue={hours.start} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessHoursEnd">{dict.settings.endHour}</Label>
            <Input id="businessHoursEnd" name="businessHoursEnd" type="number" min={1} max={24} defaultValue={hours.end} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{dict.settings.days}</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const checked = days.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setDays((prev) => (checked ? prev.filter((d) => d !== day.value) : [...prev, day.value].sort()))}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
                >
                  {locale === "fr" ? day.labelFr : day.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="approvalMode" name="approvalMode" defaultChecked={company.approvalMode} />
        <Label htmlFor="approvalMode" className="font-normal">
          {dict.settings.approvalMode} — {dict.settings.approvalModeDesc}
        </Label>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton label={dict.common.save} />
    </form>
  );
}
