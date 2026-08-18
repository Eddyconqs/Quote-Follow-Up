import { Badge, type BadgeProps } from "@/components/ui/badge";

const QUOTE_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  DRAFT: "muted",
  SENT: "secondary",
  FOLLOW_UP_SCHEDULED: "accent",
  CUSTOMER_REPLIED: "warning",
  WON: "success",
  LOST: "destructive",
  PAUSED: "muted",
  EXPIRED: "destructive",
  POSTPONED: "muted",
};

const FOLLOW_UP_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  NONE: "muted",
  SCHEDULED: "secondary",
  ACTIVE: "accent",
  PAUSED: "muted",
  COMPLETED: "success",
  CANCELLED: "muted",
  FAILED: "destructive",
};

const MESSAGE_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  DRAFT: "muted",
  PENDING_APPROVAL: "warning",
  SCHEDULED: "secondary",
  SENT: "accent",
  DELIVERED: "success",
  FAILED: "destructive",
  REPLIED: "success",
  CANCELLED: "muted",
};

const JOB_HANDOFF_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  NOT_STARTED: "muted",
  READY_FOR_SCHEDULING: "accent",
  SCHEDULED: "secondary",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

function StatusBadgeBase({ label, variant }: { label: string; variant: BadgeProps["variant"] }) {
  return <Badge variant={variant}>{label}</Badge>;
}

export function QuoteStatusBadge({ status, label }: { status: string; label: string }) {
  return <StatusBadgeBase label={label} variant={QUOTE_STATUS_VARIANT[status] ?? "outline"} />;
}

export function FollowUpStatusBadge({ status, label }: { status: string; label: string }) {
  return <StatusBadgeBase label={label} variant={FOLLOW_UP_STATUS_VARIANT[status] ?? "outline"} />;
}

export function MessageStatusBadge({ status, label }: { status: string; label: string }) {
  return <StatusBadgeBase label={label} variant={MESSAGE_STATUS_VARIANT[status] ?? "outline"} />;
}

export function JobHandoffStatusBadge({ status, label }: { status: string; label: string }) {
  return <StatusBadgeBase label={label} variant={JOB_HANDOFF_STATUS_VARIANT[status] ?? "outline"} />;
}
