"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV } from "@/lib/dashboard-nav";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-72 md:flex-shrink-0 border-b md:border-b-0 md:border-r bg-background">
      <div className="p-4 md:p-5">
        <div className="text-sm font-semibold tracking-tight">ReconAI</div>
        <div className="text-xs text-muted-foreground mt-1">
          Financial Intelligence Platform
        </div>
      </div>

      <nav className="px-2 pb-4 md:pb-6 overflow-y-auto md:h-[calc(100vh-72px)]">
        {DASHBOARD_NAV.map((section) => (
          <div key={section.section} className="mb-4">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {section.section}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/60 hover:text-accent-foreground",
                    ].join(" ")}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="ml-3 text-[10px] rounded px-1.5 py-0.5 border">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
