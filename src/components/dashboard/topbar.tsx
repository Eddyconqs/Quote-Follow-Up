"use client";

import Link from "next/link";
import { Menu, LogOut, Plus, UserPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useNavItems } from "@/components/dashboard/sidebar-nav";
import { logoutAction } from "@/app/(auth)/actions";
import type { Dictionary, Locale } from "@/lib/i18n";

export function Topbar({
  dict,
  locale,
  userName,
  companyName,
}: {
  dict: Dictionary;
  locale: Locale;
  userName: string;
  companyName: string;
}) {
  const items = useNavItems(dict);

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {items.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="hidden flex-col sm:flex">
          <span className="text-sm font-medium leading-tight">{companyName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
          <Link href="/dashboard/customers/new">
            <UserPlus className="h-4 w-4" />
            {dict.dashboard.newCustomer}
          </Link>
        </Button>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/dashboard/quotes/new">
            <Plus className="h-4 w-4" />
            {dict.dashboard.newQuote}
          </Link>
        </Button>
        <LanguageSwitcher locale={locale} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              {userName}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">{dict.nav.settings}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm text-destructive">
                <LogOut className="h-4 w-4" />
                {dict.nav.logout}
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
