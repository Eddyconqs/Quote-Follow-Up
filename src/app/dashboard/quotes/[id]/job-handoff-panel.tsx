"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { JobHandoffStatusBadge } from "@/components/domain/status-badge";
import { createJobHandoffAction, type ActionState } from "./actions";
import { SERVICE_TYPES } from "@/lib/validation/quote";
import { formatDate } from "@/lib/utils";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { JobHandoff, User } from "@prisma/client";

const initialState: ActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function JobHandoffPanel({
  dict,
  locale,
  quoteId,
  quoteStatus,
  defaultServiceType,
  handoff,
  users,
}: {
  dict: Dictionary;
  locale: Locale;
  quoteId: string;
  quoteStatus: string;
  defaultServiceType: string;
  handoff: JobHandoff | null;
  users: User[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createJobHandoffAction, initialState);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  if (handoff) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{dict.common.status}</span>
          <JobHandoffStatusBadge status={handoff.status} label={dict.jobHandoffStatus[handoff.status]} />
        </div>
        {handoff.serviceType && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.jobHandoffForm.serviceType}</span>
            <span>{dict.serviceTypes[handoff.serviceType as keyof typeof dict.serviceTypes] ?? handoff.serviceType}</span>
          </div>
        )}
        {handoff.scheduledDate && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.jobHandoffForm.scheduledDate}</span>
            <span>{formatDate(handoff.scheduledDate, locale)}</span>
          </div>
        )}
        {handoff.notes && <p className="whitespace-pre-wrap text-muted-foreground">{handoff.notes}</p>}
      </div>
    );
  }

  if (quoteStatus !== "WON") {
    return <p className="text-sm text-muted-foreground">{dict.quoteDetail.noActivity}</p>;
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Briefcase className="h-4 w-4" />
        {dict.quoteDetail.createJobHandoff}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.jobHandoffForm.title}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="quoteId" value={quoteId} />
            <div className="space-y-1.5">
              <Label htmlFor="serviceType">{dict.jobHandoffForm.serviceType}</Label>
              <Select name="serviceType" defaultValue={defaultServiceType}>
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
              <Label htmlFor="scheduledDate">
                {dict.jobHandoffForm.scheduledDate} <span className="text-muted-foreground">({dict.common.optional})</span>
              </Label>
              <Input id="scheduledDate" name="scheduledDate" type="date" />
            </div>
            {users.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="assignedUserId">
                  {dict.jobHandoffForm.assignedUser} <span className="text-muted-foreground">({dict.common.optional})</span>
                </Label>
                <Select name="assignedUserId">
                  <SelectTrigger id="assignedUserId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="handoff-notes">
                {dict.jobHandoffForm.notes} <span className="text-muted-foreground">({dict.common.optional})</span>
              </Label>
              <Textarea id="handoff-notes" name="notes" rows={3} maxLength={2000} />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict.common.cancel}
              </Button>
              <SubmitButton label={dict.jobHandoffForm.submit} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
