"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveMessageAction, retryMessageAction, type ActionState } from "./actions";
import type { Dictionary } from "@/lib/i18n";

export function MessageRowActions({
  dict,
  messageId,
  quoteId,
  status,
}: {
  dict: Dictionary;
  messageId: string;
  quoteId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<ActionState>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
    });
  }

  if (status === "PENDING_APPROVAL") {
    return (
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => approveMessageAction(messageId, quoteId))}>
        {dict.quoteDetail.approve}
      </Button>
    );
  }

  if (status === "FAILED") {
    return (
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => retryMessageAction(messageId, quoteId))}>
        {dict.quoteDetail.retry}
      </Button>
    );
  }

  return null;
}
