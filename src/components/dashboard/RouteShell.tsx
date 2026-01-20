// src/components/dashboard/RouteShell.tsx
// Enterprise-grade route shell for dashboard destinations.
// Auto-derives title, subtitle, breadcrumb from canonical dashboardNav.
// Token-only styling; uses dashboard semantic tokens.

"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageSurface } from "@/components/dashboard/PageSurface";
import { Breadcrumb, ModuleSubNav } from "@/components/dashboard/ModuleSubNav";
import {
  getNavEntryByPathname,
  getChildRoutes,
  isModuleLanding,
  type ModuleKey,
} from "@/lib/dashboardNav";
import type { Route } from "@/lib/routes";

interface RouteShellProps {
  /** Override: Page title (falls back to canonical nav) */
  title?: string;
  /** Override: Page subtitle (falls back to canonical nav) */
  subtitle?: string;
  /** Page content */
  children?: React.ReactNode;
  /** Actions to render in header right section */
  right?: React.ReactNode;
  /** Show breadcrumb (default: true for non-landing pages) */
  showBreadcrumb?: boolean;
  /** Show module sub-navigation (default: auto-detect) */
  showSubNav?: boolean;
  /** Additional className for the outer wrapper */
  className?: string;
}

/**
 * RouteShell — Canonical wrapper for all dashboard routes.
 * Automatically derives page title, subtitle, and breadcrumb from dashboardNav.ts.
 * Provides consistent page structure with enterprise density.
 * Desktop-first: tighter padding on lg+, comfortable on mobile.
 */
export function RouteShell({
  title: titleOverride,
  subtitle: subtitleOverride,
  children,
  right,
  showBreadcrumb,
  showSubNav,
  className,
}: RouteShellProps) {
  const pathname = usePathname();

  // Memoize nav entry lookup (cheap O(1) lookup, but memoize for stability)
  const navEntry = useMemo(() => getNavEntryByPathname(pathname), [pathname]);

  // Derive title and subtitle from nav entry or use overrides
  const title = titleOverride ?? navEntry?.displayTitle ?? "Dashboard";
  const subtitle = subtitleOverride ?? navEntry?.subtitle;

  // Determine if we should show breadcrumb
  // Default: show if not a module landing (breadcrumb length > 1)
  const shouldShowBreadcrumb = useMemo(() => {
    if (showBreadcrumb !== undefined) return showBreadcrumb;
    if (!navEntry) return false;
    return navEntry.breadcrumb.length > 1;
  }, [showBreadcrumb, navEntry]);

  // Determine if we should show module sub-nav
  // Default: show on module landing pages if there are child routes
  const shouldShowSubNav = useMemo(() => {
    if (showSubNav !== undefined) return showSubNav;
    if (!navEntry) return false;
    // Only show on module landing pages
    if (!isModuleLanding(pathname as Route)) return false;
    // Only show if there are child routes
    const childRoutes = getChildRoutes(pathname as Route);
    return childRoutes.length > 0;
  }, [showSubNav, navEntry, pathname]);

  // Get module key for sub-nav
  const moduleKey = navEntry?.module as ModuleKey | undefined;

  return (
    <div
      className={["w-full px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6", className]
        .filter(Boolean)
        .join(" ")}
    >
      <PageSurface>
        {/* Breadcrumb - shown for non-landing pages */}
        {shouldShowBreadcrumb && navEntry && (
          <div className="mb-3">
            <Breadcrumb route={pathname as Route} showHome />
          </div>
        )}

        {/* Page Header with canonical title/subtitle */}
        <PageHeader title={title} subtitle={subtitle} actions={right} />

        {/* Signature accent divider (restrained) */}
        <div className="dash-accent-divider" />

        {/* Module Sub-Navigation - shown on module landing pages */}
        {shouldShowSubNav && moduleKey && (
          <div className="mt-4 mb-2 rounded-[var(--elevation-radius-lg)] border border-border/60 bg-muted/20 backdrop-blur-sm shadow-sm">
            <div className="px-3 py-2">
              <ModuleSubNav module={moduleKey} compact showDescriptions />
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="space-y-4 lg:space-y-5">{children}</div>
      </PageSurface>
    </div>
  );
}
