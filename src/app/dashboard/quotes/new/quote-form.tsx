"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createQuoteAction, type QuoteFormState } from "../actions";
import { createCustomerInlineAction } from "../../customers/actions";
import { CustomerForm } from "../../customers/customer-form";
import { SERVICE_TYPES } from "@/lib/validation/quote";
import type { Dictionary } from "@/lib/i18n";
import type { Customer, FollowUpSequence } from "@prisma/client";

const initialState: QuoteFormState = {};

function SubmitButtons({ dict }: { dict: Dictionary }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending}>
        {dict.quoteForm.saveDraft}
      </Button>
      <Button type="submit" name="intent" value="activate" disabled={pending}>
        {dict.quoteForm.saveAndActivate}
      </Button>
    </div>
  );
}

export function QuoteForm({
  dict,
  customers: initialCustomers,
  sequences,
  companyDefaultLanguage,
}: {
  dict: Dictionary;
  customers: Customer[];
  sequences: FollowUpSequence[];
  companyDefaultLanguage: "FR" | "EN";
}) {
  const [state, formAction] = useFormState(createQuoteAction, initialState);
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomers[0]?.id ?? "");
  const [inlineOpen, setInlineOpen] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="customerId">{dict.quoteForm.customer}</Label>
        <div className="flex gap-2">
          <Select name="customerId" value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger id="customerId" className="flex-1">
              <SelectValue placeholder={dict.quoteForm.selectCustomer} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={() => setInlineOpen(true)} aria-label={dict.quoteForm.createCustomerInline}>
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        {selectedCustomer && (
          <div className="flex gap-2 pt-1">
            <Badge variant={selectedCustomer.emailConsent ? "success" : "muted"}>{dict.customers.emailConsent}</Badge>
            <Badge variant={selectedCustomer.smsConsent ? "success" : "muted"}>{dict.customers.smsConsent}</Badge>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">{dict.quoteForm.title}</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="serviceType">{dict.quoteForm.serviceType}</Label>
          <Select name="serviceType" defaultValue="HVAC">
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
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="flex-1" />
            <Select name="currency" defaultValue="CAD">
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
          <Input id="quoteDate" name="quoteDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expirationDate">
            {dict.quoteForm.expirationDate} <span className="text-muted-foreground">({dict.common.optional})</span>
          </Label>
          <Input id="expirationDate" name="expirationDate" type="date" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="language">{dict.quoteForm.language}</Label>
          <Select name="language" defaultValue={selectedCustomer?.preferredLanguage ?? companyDefaultLanguage}>
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
          <Select name="source" defaultValue="MANUAL">
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
        <Textarea id="description" name="description" rows={3} maxLength={4000} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">
          {dict.quoteForm.notes} <span className="text-muted-foreground">({dict.common.optional})</span>
        </Label>
        <Textarea id="notes" name="notes" rows={2} maxLength={4000} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sequenceId">{dict.quoteForm.followUpSequence}</Label>
        <Select name="sequenceId" defaultValue={sequences.find((s) => s.language === (selectedCustomer?.preferredLanguage ?? companyDefaultLanguage))?.id}>
          <SelectTrigger id="sequenceId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sequences.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButtons dict={dict} />

      <Dialog open={inlineOpen} onOpenChange={setInlineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.quoteForm.createCustomerInline}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            dict={dict}
            action={createCustomerInlineAction}
            onCreated={(customer) => {
              setCustomers((prev) => [customer, ...prev]);
              setSelectedCustomerId(customer.id);
              setInlineOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </form>
  );
}
