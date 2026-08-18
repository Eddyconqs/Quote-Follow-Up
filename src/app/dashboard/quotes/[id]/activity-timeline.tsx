import { Activity as ActivityIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Activity } from "@prisma/client";

export function ActivityTimeline({ dict, locale, activities }: { dict: Dictionary; locale: Locale; activities: Activity[] }) {
  if (activities.length === 0) {
    return <EmptyState title={dict.quoteDetail.noActivity} className="py-8" />;
  }

  return (
    <ul className="space-y-3">
      {activities.map((activity) => (
        <li key={activity.id} className="flex gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
            <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm">{dict.activityType[activity.type]}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt, locale)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
