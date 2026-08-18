"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { deleteAccountAction, type SettingsActionState } from "./actions";
import type { Dictionary } from "@/lib/i18n";

const initialState: SettingsActionState = {};

function SubmitButton({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={disabled || pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function DangerZone({ dict, companyName }: { dict: Dictionary; companyName: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [state, formAction] = useFormState(deleteAccountAction, initialState);

  return (
    <div className="space-y-3 rounded-md border border-destructive/30 p-4">
      <div>
        <p className="text-sm font-medium text-destructive">{dict.settings.deleteAccount}</p>
        <p className="text-sm text-muted-foreground">{dict.settings.deleteAccountDesc}</p>
      </div>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        {dict.settings.deleteAccount}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.settings.deleteAccount}</DialogTitle>
            <DialogDescription>{dict.settings.deleteAccountDesc}</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="confirmName">
                {dict.settings.deleteAccountConfirmLabel}: <span className="font-semibold">{companyName}</span>
              </Label>
              <Input id="confirmName" name="confirmName" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict.common.cancel}
              </Button>
              <SubmitButton label={dict.common.confirm} disabled={confirmText !== companyName} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
