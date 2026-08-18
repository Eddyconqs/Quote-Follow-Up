"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n";

export function useNavItems(dict: Dictionary) {
  return [
    { href: "/dashboard", label: dict.nav.dashboard, icon: LayoutDashboard },
    { href: "/dashboard/quotes", label: dict.nav.quotes, icon: FileText },
    { href: "/dashboard/customers", label: dict.nav.customers, icon: Users },
    { href: "/dashboard/analytics", label: dict.nav.analytics, icon: BarChart3 },
    { href: "/dashboard/settings", label: dict.nav.settings, icon: Settings },
  ];
}

export function SidebarNav({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();
  const items = useNavItems(dict);

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
