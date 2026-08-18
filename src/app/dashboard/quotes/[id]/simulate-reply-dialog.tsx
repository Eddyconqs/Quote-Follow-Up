"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { simulateReplyAction, type ActionState } from "./actions";
import type { Dictionary } from "@/lib/i18n";

const initialState: ActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function SimulateReplyDialog({ dict, quoteId }: { dict: Dictionary; quoteId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(simulateReplyAction, initialState);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquareReply className="h-4 w-4" />
        {dict.quoteDetail.simulateReply}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.quoteDetail.simulateReply}</DialogTitle>
            <DialogDescription>{dict.quoteDetail.simulateReplyDesc}</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="quoteId" value={quoteId} />
            <div className="space-y-1.5">
              <Label htmlFor="reply-body">{dict.quoteDetail.manualMessageBody}</Label>
              <Textarea id="reply-body" name="body" required rows={4} maxLength={4000} />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict.common.cancel}
              </Button>
              <SubmitButton label={dict.common.confirm} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
