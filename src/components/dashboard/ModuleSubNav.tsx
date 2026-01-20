// src/components/dashboard/ModuleSubNav.tsx
// Sub-navigation for module landing pages.
// Displays sibling routes within the same module, sorted by order.
// Token-only styling; desktop-first.

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  NAV,
  getModuleRoutes,
  type ModuleKey,
  type NavEntry,
} from "@/lib/dashboardNav";
import type { Route } from "@/lib/routes";

interface ModuleSubNavProps {
  /** The module to display routes for */
  module: ModuleKey;
  /** Optional: exclude certain routes */
  exclude?: Route[];
  /** Optional: only show these routes (overrides exclude) */
  include?: Route[];
  /** Show descriptions alongside labels */
  showDescriptions?: boolean;
  /** Compact mode: smaller text, less padding */
  compact?: boolean;
}

/**
 * ModuleSubNav — Displays navigation links for routes within a module.
 * Routes are sorted by their canonical order from dashboardNav.
 * Used on module landing pages to provide quick access to sub-pages.
 */
export function ModuleSubNav({
  module,
  exclude = [],
  include,
  showDescriptions = false,
  compact = false,
}: ModuleSubNavProps) {
  const pathname = usePathname();

  // Get all routes for this module (already sorted by order from getModuleRoutes)
  let routes = getModuleRoutes(module);

  // Apply include filter if provided
  if (include && include.length > 0) {
    routes = routes.filter((r) => include.includes(r));
  } else {
    // Apply exclude filter
    routes = routes.filter((r) => !exclude.includes(r));
  }

  // Filter out the current route and module landing pages
  routes = routes.filter((r) => {
    const entry = NAV[r];
    // Skip if this is the current page
    if (r === pathname) return false;
    // Skip if this is a module landing (breadcrumb length === 1)
    if (entry && entry.breadcrumb.length === 1) return false;
    return true;
  });

  if (routes.length === 0) {
    return null;
  }

  return (
    <nav
      className={["space-y-1", compact ? "text-sm" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${module} module navigation`}
    >
      {routes.map((route) => {
        const entry = NAV[route] as NavEntry;
        const isActive = pathname === route;

        return (
          <Link
            key={route}
            href={route}
            className={[
              "group flex items-center gap-3 rounded-md transition",
              compact ? "px-2 py-1.5" : "px-3 py-2",
              isActive
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground">
                {entry.shortLabel}
              </span>
              {showDescriptions && entry.subtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.subtitle}
                </p>
              )}
            </div>
            <ChevronRight
              className={[
                "h-3 w-3 shrink-0 transition",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              ].join(" ")}
            />
          </Link>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────
// BREADCRUMB COMPONENT
// ─────────────────────────────────────────

interface BreadcrumbProps {
  /** Route to generate breadcrumb for */
  route: Route;
  /** Show home link at start */
  showHome?: boolean;
}

/**
 * Breadcrumb — Displays breadcrumb trail for a route.
 * Uses canonical breadcrumb data from dashboardNav.
 */
export function Breadcrumb({ route, showHome = false }: BreadcrumbProps) {
  const entry = NAV[route];
  if (!entry) return null;

  const crumbs = [...entry.breadcrumb];

  // Optionally prepend Home
  if (showHome && crumbs[0]?.[0] !== "Home") {
    crumbs.unshift(["Home", "/home" as Route]);
  }

  return (
    <nav
      className="flex items-center gap-1 text-sm text-muted-foreground"
      aria-label="Breadcrumb"
    >
      {crumbs.map(([label, href], index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <React.Fragment key={`${label}-${index}`}>
            {index > 0 && (
              <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            {isLast || !href ? (
              <span
                className={isLast ? "text-foreground font-medium" : ""}
                aria-current={isLast ? "page" : undefined}
              >
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
