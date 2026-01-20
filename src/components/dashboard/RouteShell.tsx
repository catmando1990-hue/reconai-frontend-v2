// src/components/dashboard/RouteShell.tsx
// Enterprise-grade route shell for dashboard destinations.
// Token-only styling; uses dashboard semantic tokens.

import React from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageSurface } from "@/components/dashboard/PageSurface";

interface RouteShellProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  right?: React.ReactNode;
}

/**
 * RouteShell — Canonical wrapper for all dashboard routes.
 * Provides consistent page structure with enterprise density.
 * Desktop-first: tighter padding on lg+, comfortable on mobile.
 */
export function RouteShell({
  title,
  subtitle,
  children,
  right,
}: RouteShellProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      <PageSurface>
        <PageHeader title={title} subtitle={subtitle} actions={right} />
        <div className="space-y-4 lg:space-y-5">{children}</div>
      </PageSurface>
    </div>
  );
}
