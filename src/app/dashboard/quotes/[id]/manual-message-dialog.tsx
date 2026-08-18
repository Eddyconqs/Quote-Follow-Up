"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { sendManualMessageAction, type ActionState } from "./actions";
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

export function ManualMessageDialog({ dict, quoteId }: { dict: Dictionary; quoteId: string }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState("EMAIL");
  const [state, formAction] = useFormState(sendManualMessageAction, initialState);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" />
        {dict.quoteDetail.sendManualMessage}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.quoteDetail.sendManualMessage}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="quoteId" value={quoteId} />
            <div className="space-y-1.5">
              <Label htmlFor="channel">{dict.quoteDetail.channelLabel}</Label>
              <Select name="channel" value={channel} onValueChange={setChannel}>
                <SelectTrigger id="channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">{dict.messageChannel.EMAIL}</SelectItem>
                  <SelectItem value="SMS">{dict.messageChannel.SMS}</SelectItem>
                  <SelectItem value="MANUAL_TASK">{dict.messageChannel.MANUAL_TASK}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {channel === "EMAIL" && (
              <div className="space-y-1.5">
                <Label htmlFor="subject">{dict.quoteDetail.manualMessageSubject}</Label>
                <Input id="subject" name="subject" maxLength={200} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="body">{dict.quoteDetail.manualMessageBody}</Label>
              <Textarea id="body" name="body" required rows={5} maxLength={4000} />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict.common.cancel}
              </Button>
              <SubmitButton label={dict.quoteDetail.sendManualMessage} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
