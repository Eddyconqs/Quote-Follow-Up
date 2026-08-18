"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";

const SHOTS = [
  { key: "dashboard", src: "/screenshots/dashboard.png", width: 1440, height: 1742 },
  { key: "quotes", src: "/screenshots/quotes-list.png", width: 1440, height: 921 },
  { key: "detail", src: "/screenshots/quote-detail.png", width: 1440, height: 900 },
] as const;

export function ProductShowcase({ dict }: { dict: Dictionary }) {
  const [active, setActive] = useState<(typeof SHOTS)[number]["key"]>("dashboard");

  const tabs = [
    { key: "dashboard" as const, label: dict.dashboard.title },
    { key: "quotes" as const, label: dict.quotes.title },
    { key: "detail" as const, label: dict.quoteDetail.quoteInformation },
  ];

  const activeShot = SHOTS.find((s) => s.key === active)!;

  return (
    <div>
      <div className="mb-6 flex justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
              active === tab.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <Image
          src={activeShot.src}
          alt={tabs.find((t) => t.key === active)?.label ?? ""}
          width={activeShot.width}
          height={activeShot.height}
          className="w-full"
          priority={active === "dashboard"}
        />
      </div>
    </div>
  );
}
