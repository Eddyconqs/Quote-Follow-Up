import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (!user.company.businessType) redirect("/onboarding");

  const { locale, dict } = await getDictionary();

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="px-5 py-5">
          <span className="text-lg font-semibold tracking-tight text-primary">{dict.common.appName}</span>
        </div>
        <div className="flex-1 px-3">
          <SidebarNav dict={dict} />
        </div>
        {user.company.isDemo && (
          <div className="mx-3 mb-4 rounded-md bg-warning/10 px-3 py-2 text-xs font-medium text-warning">{dict.common.demoData}</div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar dict={dict} locale={locale} userName={user.name} companyName={user.company.name} />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
