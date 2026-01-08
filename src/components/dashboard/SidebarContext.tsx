"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: Record<string, { label: string; href: string }[]> = {
  dashboard: [{ label: "Overview", href: "/dashboard" }],
  core: [
    { label: "Overview", href: "/dashboard/core" },
    { label: "Accounts", href: "/dashboard/core/accounts" },
    { label: "Transactions", href: "/dashboard/core/transactions" },
  ],
  intelligence: [
    { label: "Overview", href: "/dashboard/intelligence" },
    { label: "Expense Intelligence", href: "/dashboard/intelligence/expenses" },
    { label: "Travel Signals", href: "/dashboard/intelligence/travel" },
  ],
  cfo: [
    { label: "Overview", href: "/dashboard/cfo" },
    { label: "Executive Summary", href: "/dashboard/cfo/summary" },
    { label: "Compliance View", href: "/dashboard/cfo/compliance" },
  ],
  settings: [{ label: "Profile", href: "/dashboard/settings" }],
};

export function SidebarContext() {
  const pathname = usePathname();

  const section = pathname.includes("/core")
    ? "core"
    : pathname.includes("/intelligence")
      ? "intelligence"
      : pathname.includes("/cfo")
        ? "cfo"
        : pathname.includes("/settings")
          ? "settings"
          : "dashboard";

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background px-4 py-6">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-4">
        {section}
      </div>
      <nav className="space-y-1">
        {NAV[section].map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
