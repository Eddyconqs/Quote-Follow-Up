"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { Customer } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Dictionary } from "@/lib/i18n";
import type { CustomerFormState } from "./actions";

const initialState: CustomerFormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function CustomerForm({
  dict,
  action,
  onCreated,
  submitLabel,
}: {
  dict: Dictionary;
  action: (prev: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
  onCreated?: (customer: Customer) => void;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.customer) {
      onCreated?.(state.customer);
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.customer]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{dict.customers.firstName}</Label>
          <Input id="firstName" name="firstName" required maxLength={100} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{dict.customers.lastName}</Label>
          <Input id="lastName" name="lastName" required maxLength={100} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">{dict.customers.email}</Label>
          <Input id="email" name="email" type="email" maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{dict.customers.phone}</Label>
          <Input id="phone" name="phone" type="tel" maxLength={20} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="preferredLanguage">{dict.customers.preferredLanguage}</Label>
        <Select name="preferredLanguage" defaultValue="FR">
          <SelectTrigger id="preferredLanguage" className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FR">{dict.common.french}</SelectItem>
            <SelectItem value="EN">{dict.common.english}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">
          {dict.customers.address} <span className="text-muted-foreground">({dict.common.optional})</span>
        </Label>
        <Input id="address" name="address" maxLength={300} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">
          {dict.customers.notes} <span className="text-muted-foreground">({dict.common.optional})</span>
        </Label>
        <Textarea id="notes" name="notes" maxLength={2000} rows={3} />
      </div>

      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="flex items-center gap-2">
          <Checkbox id="emailConsent" name="emailConsent" />
          <Label htmlFor="emailConsent" className="font-normal">
            {dict.customers.emailConsent}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="smsConsent" name="smsConsent" />
          <Label htmlFor="smsConsent" className="font-normal">
            {dict.customers.smsConsent}
          </Label>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton label={submitLabel ?? dict.common.create} />
    </form>
  );
}
