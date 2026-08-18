"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_TYPES } from "@/lib/validation/quote";
import type { Dictionary } from "@/lib/i18n";

const QUOTE_STATUSES = [
  "DRAFT",
  "SENT",
  "FOLLOW_UP_SCHEDULED",
  "CUSTOMER_REPLIED",
  "WON",
  "LOST",
  "PAUSED",
  "EXPIRED",
  "POSTPONED",
] as const;

const FOLLOW_UP_STATUSES = ["NONE", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED", "FAILED"] as const;

const ALL = "__all__";

export function QuoteFilters({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={dict.common.search}
          defaultValue={searchParams.get("q") ?? ""}
          className="pl-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParam("q", e.currentTarget.value);
          }}
          onBlur={(e) => updateParam("q", e.currentTarget.value)}
        />
      </div>

      <Select defaultValue={searchParams.get("status") ?? ALL} onValueChange={(v) => updateParam("status", v)}>
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder={dict.common.status} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.common.status}</SelectItem>
          {QUOTE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {dict.quoteStatus[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("followUpStatus") ?? ALL} onValueChange={(v) => updateParam("followUpStatus", v)}>
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder={dict.quotes.followUpStatus} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.quotes.followUpStatus}</SelectItem>
          {FOLLOW_UP_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {dict.followUpStatus[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("language") ?? ALL} onValueChange={(v) => updateParam("language", v)}>
        <SelectTrigger className="sm:w-36">
          <SelectValue placeholder={dict.common.language} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.common.language}</SelectItem>
          <SelectItem value="FR">{dict.common.french}</SelectItem>
          <SelectItem value="EN">{dict.common.english}</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("serviceType") ?? ALL} onValueChange={(v) => updateParam("serviceType", v)}>
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder={dict.quoteForm.serviceType} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.quoteForm.serviceType}</SelectItem>
          {SERVICE_TYPES.map((s) => (
            <SelectItem key={s} value={s}>
              {dict.serviceTypes[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={`${searchParams.get("sort") ?? "quoteDate"}:${searchParams.get("dir") ?? "desc"}`}
        onValueChange={(v) => {
          const [sort, dir] = v.split(":");
          const params = new URLSearchParams(searchParams.toString());
          params.set("sort", sort);
          params.set("dir", dir);
          startTransition(() => router.push(`${pathname}?${params.toString()}`));
        }}
      >
        <SelectTrigger className="sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="quoteDate:desc">{dict.quotes.quoteDate} ↓</SelectItem>
          <SelectItem value="quoteDate:asc">{dict.quotes.quoteDate} ↑</SelectItem>
          <SelectItem value="amount:desc">{dict.quotes.amount} ↓</SelectItem>
          <SelectItem value="amount:asc">{dict.quotes.amount} ↑</SelectItem>
          <SelectItem value="nextFollowUpAt:asc">{dict.quotes.nextFollowUp} ↑</SelectItem>
          <SelectItem value="status:asc">{dict.common.status}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
