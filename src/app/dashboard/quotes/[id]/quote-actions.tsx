"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Pencil, Play, Pause, RotateCcw, Trophy, XCircle, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/shared/confirm-button";
import {
  activateFollowUpAction,
  pauseFollowUpAction,
  resumeFollowUpAction,
  markWonAction,
  markLostAction,
  markPostponedAction,
  deleteQuoteAction,
  type ActionState,
} from "./actions";
import { LOST_REASONS } from "@/lib/validation/quote";
import type { Dictionary } from "@/lib/i18n";
import type { FollowUpSequence } from "@prisma/client";

const initialState: ActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

function MarkLostDialog({ dict, quoteId }: { dict: Dictionary; quoteId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(markLostAction, initialState);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <XCircle className="h-4 w-4" />
        {dict.quoteDetail.markLost}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.quoteDetail.markLost}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="quoteId" value={quoteId} />
            <div className="space-y-1.5">
              <Label htmlFor="lostReason">{dict.quoteDetail.lostReasonLabel}</Label>
              <Select name="lostReason" defaultValue={LOST_REASONS[0]}>
                <SelectTrigger id="lostReason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOST_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {dict.lostReason[reason]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">{dict.quoteForm.notes}</Label>
              <Textarea id="notes" name="notes" rows={3} maxLength={2000} />
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

export function QuoteActions({
  dict,
  quoteId,
  status,
  followUpStatus,
  activeEnrollmentId,
  sequences,
  customerLanguage,
}: {
  dict: Dictionary;
  quoteId: string;
  status: string;
  followUpStatus: string;
  activeEnrollmentId: string | null;
  sequences: FollowUpSequence[];
  customerLanguage: "FR" | "EN";
}) {
  const [isPending, startTransition] = useTransition();
  const [sequenceId, setSequenceId] = useState(sequences.find((s) => s.language === customerLanguage)?.id ?? sequences[0]?.id ?? "");
  const isTerminal = status === "WON" || status === "LOST";

  function run(action: () => Promise<ActionState>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else toast.success(successMessage);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/quotes/${quoteId}/edit`}>
          <Pencil className="h-4 w-4" />
          {dict.quoteDetail.editQuote}
        </Link>
      </Button>

      {!isTerminal && followUpStatus === "ACTIVE" && activeEnrollmentId && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => run(() => pauseFollowUpAction(activeEnrollmentId, quoteId), dict.quoteDetail.pauseFollowUp)}
        >
          <Pause className="h-4 w-4" />
          {dict.quoteDetail.pauseFollowUp}
        </Button>
      )}

      {!isTerminal && followUpStatus === "PAUSED" && activeEnrollmentId && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => run(() => resumeFollowUpAction(activeEnrollmentId, quoteId), dict.quoteDetail.resumeFollowUp)}
        >
          <RotateCcw className="h-4 w-4" />
          {dict.quoteDetail.resumeFollowUp}
        </Button>
      )}

      {!isTerminal && (followUpStatus === "NONE" || followUpStatus === "CANCELLED" || followUpStatus === "COMPLETED") && (
        <div className="flex items-center gap-1">
          <Select value={sequenceId} onValueChange={setSequenceId}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder={dict.quoteForm.followUpSequence} />
            </SelectTrigger>
            <SelectContent>
              {sequences.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            disabled={isPending || !sequenceId}
            onClick={() => run(() => activateFollowUpAction(quoteId, sequenceId), dict.quoteDetail.activateFollowUp)}
          >
            <Play className="h-4 w-4" />
            {dict.quoteDetail.activateFollowUp}
          </Button>
        </div>
      )}

      {!isTerminal && (
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => run(() => markWonAction(quoteId), dict.quoteDetail.markWon)}>
          <Trophy className="h-4 w-4" />
          {dict.quoteDetail.markWon}
        </Button>
      )}

      {!isTerminal && <MarkLostDialog dict={dict} quoteId={quoteId} />}

      {!isTerminal && status !== "POSTPONED" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => run(() => markPostponedAction(quoteId), dict.quoteDetail.markPostponed)}
        >
          <Clock className="h-4 w-4" />
          {dict.quoteDetail.markPostponed}
        </Button>
      )}

      <ConfirmButton
        label={dict.quoteDetail.deleteQuote}
        confirmTitle={dict.quoteDetail.deleteConfirmTitle}
        confirmDescription={dict.quoteDetail.deleteConfirmBody}
        confirmLabel={dict.common.delete}
        cancelLabel={dict.common.cancel}
        icon={<Trash2 className="h-4 w-4" />}
        onConfirm={() => deleteQuoteAction(quoteId)}
      />
    </div>
  );
}
