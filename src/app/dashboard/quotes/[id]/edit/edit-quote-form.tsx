"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateQuoteAction, type ActionState } from "../actions";
import { SERVICE_TYPES } from "@/lib/validation/quote";
import type { Dictionary } from "@/lib/i18n";
import type { Quote, Customer } from "@prisma/client";

const initialState: ActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function EditQuoteForm({ dict, quote, customers }: { dict: Dictionary; quote: Quote; customers: Customer[] }) {
  const [state, formAction] = useFormState(updateQuoteAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="quoteId" value={quote.id} />

      <div className="space-y-1.5">
        <Label htmlFor="customerId">{dict.quoteForm.customer}</Label>
        <Select name="customerId" defaultValue={quote.customerId}>
          <SelectTrigger id="customerId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">{dict.quoteForm.title}</Label>
        <Input id="title" name="title" required maxLength={200} defaultValue={quote.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="serviceType">{dict.quoteForm.serviceType}</Label>
          <Select name="serviceType" defaultValue={quote.serviceType}>
            <SelectTrigger id="serviceType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {dict.serviceTypes[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">{dict.quoteForm.amount}</Label>
          <div className="flex gap-2">
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="flex-1" defaultValue={quote.amount.toString()} />
            <Select name="currency" defaultValue={quote.currency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="quoteDate">{dict.quoteForm.quoteDate}</Label>
          <Input id="quoteDate" name="quoteDate" type="date" required defaultValue={quote.quoteDate.toISOString().slice(0, 10)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expirationDate">
            {dict.quoteForm.expirationDate} <span className="text-muted-foreground">({dict.common.optional})</span>
          </Label>
          <Input id="expirationDate" name="expirationDate" type="date" defaultValue={quote.expirationDate?.toISOString().slice(0, 10)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="language">{dict.quoteForm.language}</Label>
          <Select name="language" defaultValue={quote.language}>
            <SelectTrigger id="language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FR">{dict.common.french}</SelectItem>
              <SelectItem value="EN">{dict.common.english}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source">{dict.quoteForm.source}</Label>
          <Select name="source" defaultValue={quote.source}>
            <SelectTrigger id="source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["MANUAL", "IMPORTED", "CRM_INTEGRATION", "WEBSITE_FORM", "PHONE_CALL", "EMAIL", "OTHER"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {dict.quoteSource[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">
          {dict.quoteForm.description} <span className="text-muted-foreground">({dict.common.optional})</span>
        </Label>
        <Textarea id="description" name="description" rows={3} maxLength={4000} defaultValue={quote.description ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">
          {dict.quoteForm.notes} <span className="text-muted-foreground">({dict.common.optional})</span>
        </Label>
        <Textarea id="notes" name="notes" rows={2} maxLength={4000} defaultValue={quote.notes ?? ""} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton label={dict.common.save} />
    </form>
  );
}
