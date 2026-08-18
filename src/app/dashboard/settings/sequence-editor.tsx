"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateSequenceAction, type SettingsActionState } from "./actions";
import type { Dictionary } from "@/lib/i18n";
import type { FollowUpSequence, FollowUpStep } from "@prisma/client";

const initialState: SettingsActionState = {};

interface StepDraft {
  stepNumber: number;
  delayInDays: number;
  channel: "EMAIL" | "SMS" | "MANUAL_TASK";
  message: string;
  requiresApproval: boolean;
  active: boolean;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function SequenceEditor({ dict, sequence }: { dict: Dictionary; sequence: FollowUpSequence & { steps: FollowUpStep[] } }) {
  const [state, formAction] = useFormState(updateSequenceAction, initialState);
  const [steps, setSteps] = useState<StepDraft[]>(
    sequence.steps
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((s) => ({ stepNumber: s.stepNumber, delayInDays: s.delayInDays, channel: s.channel, message: s.message, requiresApproval: s.requiresApproval, active: s.active }))
  );

  useEffect(() => {
    if (state.success) toast.success(dict.settings.saved);
  }, [state.success, dict.settings.saved]);

  function updateStep(index: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, { stepNumber: prev.length + 1, delayInDays: 7, channel: "EMAIL", message: "", requiresApproval: false, active: true }]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  }

  const payload = JSON.stringify({ id: sequence.id, name: sequence.name, language: sequence.language, active: sequence.active, steps });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="payload" value={payload} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {sequence.name} <span className="text-xs font-normal text-muted-foreground">({sequence.language})</span>
        </h3>
        <SubmitButton label={dict.common.save} />
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">#{step.stepNumber}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(index)}>
                <Trash2 className="h-3.5 w-3.5" />
                {dict.settings.removeStep}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">{dict.settings.delayInDays}</Label>
                <Input
                  type="number"
                  min={0}
                  max={365}
                  value={step.delayInDays}
                  onChange={(e) => updateStep(index, { delayInDays: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{dict.quoteDetail.channelLabel}</Label>
                <Select value={step.channel} onValueChange={(v) => updateStep(index, { channel: v as StepDraft["channel"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">{dict.messageChannel.EMAIL}</SelectItem>
                    <SelectItem value="SMS">{dict.messageChannel.SMS}</SelectItem>
                    <SelectItem value="MANUAL_TASK">{dict.messageChannel.MANUAL_TASK}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1.5">
                <Checkbox
                  id={`approval-${sequence.id}-${index}`}
                  checked={step.requiresApproval}
                  onCheckedChange={(checked) => updateStep(index, { requiresApproval: checked === true })}
                />
                <Label htmlFor={`approval-${sequence.id}-${index}`} className="text-xs font-normal">
                  {dict.settings.requiresApproval}
                </Label>
              </div>
            </div>

            <Textarea rows={2} value={step.message} onChange={(e) => updateStep(index, { message: e.target.value })} maxLength={4000} />
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addStep}>
        <Plus className="h-4 w-4" />
        {dict.settings.addStep}
      </Button>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
