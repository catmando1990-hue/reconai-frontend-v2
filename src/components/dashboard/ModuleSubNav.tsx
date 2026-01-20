// src/components/dashboard/ModuleSubNav.tsx
// Sub-navigation for module landing pages.
// Displays sibling routes within the same module, sorted by order.
// Enterprise-grade: keyboard accessible, clear active state, overflow handling.
// Token-only styling; desktop-first.

"use client";

import React, { useMemo } from "react";
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
  /** Horizontal layout with overflow scroll (default: false = vertical stack) */
  horizontal?: boolean;
}

/**
 * ModuleSubNav — Displays navigation links for routes within a module.
 * Routes are sorted by their canonical order from dashboardNav.
 * Used on module landing pages to provide quick access to sub-pages.
 *
 * Features:
 * - Clear active state (border + background + text, not color-only)
 * - Focus-visible rings for keyboard navigation
 * - Horizontal scroll overflow for modules with many routes
 * - aria-current for screen readers
 */
export function ModuleSubNav({
  module,
  exclude = [],
  include,
  showDescriptions = false,
  compact = false,
  horizontal = false,
}: ModuleSubNavProps) {
  const pathname = usePathname();

  // Memoize filtered routes to prevent unnecessary re-renders
  const routes = useMemo(() => {
    let filtered = getModuleRoutes(module);

    // Apply include filter if provided
    if (include && include.length > 0) {
      filtered = filtered.filter((r) => include.includes(r));
    } else {
      // Apply exclude filter
      filtered = filtered.filter((r) => !exclude.includes(r));
    }

    // Filter out the current route and module landing pages
    filtered = filtered.filter((r) => {
      const entry = NAV[r];
      // Skip if this is the current page
      if (r === pathname) return false;
      // Skip if this is a module landing (breadcrumb length === 1)
      if (entry && entry.breadcrumb.length === 1) return false;
      return true;
    });

    return filtered;
  }, [module, include, exclude, pathname]);

  if (routes.length === 0) {
    return null;
  }

  // Horizontal layout classes for desktop overflow handling
  const containerClasses = horizontal
    ? [
        "flex items-stretch gap-2 overflow-x-auto",
        // Hide scrollbar on webkit/firefox while keeping functionality
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        compact ? "text-sm" : "",
      ]
    : ["space-y-1", compact ? "text-sm" : ""];

  return (
    <nav
      className={containerClasses.filter(Boolean).join(" ")}
      aria-label={`${module} module navigation`}
      role="navigation"
    >
      {routes.map((route) => {
        const entry = NAV[route] as NavEntry;
        const isActive = pathname === route;

        // Build class list for link
        const linkClasses = [
          // Base styles
          "group flex items-center gap-2 rounded-md transition-all",
          // Focus ring for keyboard navigation (not color-only)
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Sizing
          compact ? "px-2 py-1.5" : "px-3 py-2",
          // Horizontal mode: prevent shrink, set min-width
          horizontal ? "shrink-0 whitespace-nowrap" : "",
          // Active state: stronger visual treatment (border + bg + text weight)
          isActive
            ? [
                "bg-primary/15 text-foreground font-semibold",
                "border border-primary/30",
              ].join(" ")
            : [
                "text-muted-foreground border border-transparent",
                "hover:bg-muted hover:text-foreground hover:border-border",
              ].join(" "),
        ];

        return (
          <Link
            key={route}
            href={route}
            className={linkClasses.filter(Boolean).join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="flex-1 min-w-0">
              <span
                className={isActive ? "text-foreground" : "text-foreground"}
              >
                {entry.shortLabel}
              </span>
              {showDescriptions && entry.subtitle && !horizontal && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {entry.subtitle}
                </p>
              )}
            </div>
            {!horizontal && (
              <ChevronRight
                className={[
                  "h-3 w-3 shrink-0 transition-opacity",
                  isActive
                    ? "opacity-100 text-primary"
                    : "opacity-0 group-hover:opacity-100",
                ].join(" ")}
                aria-hidden="true"
              />
            )}
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
 *
 * Features:
 * - Keyboard accessible links with focus rings
 * - aria-current="page" on current page
 * - Proper aria-label for navigation landmark
 */
export function Breadcrumb({ route, showHome = false }: BreadcrumbProps) {
  const entry = NAV[route];

  // Memoize crumbs array - must be before any early returns (React hooks rule)
  const crumbs = useMemo(() => {
    if (!entry) return [];
    const result = [...entry.breadcrumb];
    // Optionally prepend Home
    if (showHome && result[0]?.[0] !== "Home") {
      result.unshift(["Home", "/home" as Route]);
    }
    return result;
  }, [entry, showHome]);

  if (!entry || crumbs.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-1.5 text-sm"
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center gap-1.5" role="list">
        {crumbs.map(([label, href], index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={`${label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className="h-3 w-3 shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}
              {isLast || !href ? (
                <span
                  className={[
                    "px-1 py-0.5 rounded",
                    isLast
                      ? "text-foreground font-medium bg-muted/50"
                      : "text-muted-foreground",
                  ].join(" ")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className={[
                    "px-1 py-0.5 rounded text-muted-foreground",
                    "hover:text-foreground hover:bg-muted/50 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  ].join(" ")}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
