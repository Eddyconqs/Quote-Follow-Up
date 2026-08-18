import { Mail, MessageSquare, ClipboardList, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { MessageStatusBadge } from "@/components/domain/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";
import { MessageRowActions } from "./message-row-actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Message } from "@prisma/client";

const CHANNEL_ICON = { EMAIL: Mail, SMS: MessageSquare, MANUAL_TASK: ClipboardList };

export function MessageTimeline({ dict, locale, quoteId, messages }: { dict: Dictionary; locale: Locale; quoteId: string; messages: Message[] }) {
  if (messages.length === 0) {
    return <EmptyState title={dict.quoteDetail.noMessages} className="py-8" />;
  }

  return (
    <ul className="space-y-3">
      {messages.map((message) => {
        const Icon = CHANNEL_ICON[message.channel];
        const DirectionIcon = message.direction === "INBOUND" ? ArrowDownLeft : ArrowUpRight;
        const timestamp = message.sentAt ?? message.repliedAt ?? message.createdAt;

        return (
          <li key={message.id} className="flex gap-3 rounded-md border border-border p-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DirectionIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{dict.messageChannel[message.channel]}</span>
                <MessageStatusBadge status={message.status} label={dict.messageStatus[message.status]} />
                <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(timestamp, locale)}</span>
              </div>
              {message.subject && <p className="text-sm font-medium">{message.subject}</p>}
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{message.body}</p>
              {message.failureReason && <p className="text-xs text-destructive">{message.failureReason}</p>}
              <MessageRowActions dict={dict} messageId={message.id} quoteId={quoteId} status={message.status} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
