"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { getNavEntryByPathname } from "@/lib/dashboardNav";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string | null;
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link
        href="/home"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

interface TabItem {
  label: string;
  href: string;
  active?: boolean;
}

function TabNav({ tabs }: { tabs: TabItem[] }) {
  return (
    <div className="flex gap-6 border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "relative px-1 pb-3 text-sm font-medium transition-colors",
            tab.active
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
          {tab.active && (
            <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-primary rounded-full" />
          )}
        </Link>
      ))}
    </div>
  );
}

interface RouteShellV2Props {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: TabItem[];
  showBreadcrumb?: boolean;
  className?: string;
}

export function RouteShellV2({
  title: titleOverride,
  subtitle,
  children,
  actions,
  tabs,
  showBreadcrumb,
  className,
}: RouteShellV2Props) {
  const pathname = usePathname();
  const navEntry = useMemo(() => getNavEntryByPathname(pathname), [pathname]);

  const title = titleOverride ?? navEntry?.displayTitle ?? "Dashboard";

  const shouldShowBreadcrumb = useMemo(() => {
    if (showBreadcrumb !== undefined) return showBreadcrumb;
    if (!navEntry) return false;
    return navEntry.breadcrumb.length > 1;
  }, [showBreadcrumb, navEntry]);

  const breadcrumbItems = useMemo(() => {
    if (!navEntry) return [];
    return navEntry.breadcrumb.map(([label, route]) => ({
      label,
      href: route,
    }));
  }, [navEntry]);

  return (
    <div
      className={cn("min-h-full bg-[#fafafa] dark:bg-background", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {shouldShowBreadcrumb && breadcrumbItems.length > 0 && (
          <div className="mb-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          )}
        </div>

        {tabs && tabs.length > 0 && (
          <div className="mt-6">
            <TabNav tabs={tabs} />
          </div>
        )}

        <div className="mt-6 space-y-6">{children}</div>
      </div>
    </div>
  );
}
