"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_TYPES } from "@/lib/validation/quote";
import type { Dictionary } from "@/lib/i18n";

const ALL = "__all__";

export function AnalyticsFilters({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="from">{dict.quotes.quoteDate} ({dict.common.optional})</Label>
        <Input id="from" type="date" defaultValue={searchParams.get("from") ?? ""} onChange={(e) => updateParam("from", e.currentTarget.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="to">&nbsp;</Label>
        <Input id="to" type="date" defaultValue={searchParams.get("to") ?? ""} onChange={(e) => updateParam("to", e.currentTarget.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="serviceType">{dict.quoteForm.serviceType}</Label>
        <Select defaultValue={searchParams.get("serviceType") ?? ALL} onValueChange={(v) => updateParam("serviceType", v)}>
          <SelectTrigger id="serviceType" className="w-48">
            <SelectValue />
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
      </div>
    </div>
  );
}
