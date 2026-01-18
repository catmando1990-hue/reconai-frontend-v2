// src/components/dashboard/RouteShell.tsx
// Phase 1: Canonical enterprise-safe route shell used by sidebar destinations.
// Token-only styling; relies on surfaces + semantic tokens.

import React from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PageSurface } from "@/components/dashboard/PageSurface";

export function RouteShell(props: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const { title, subtitle, children, right } = props;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
      <PageSurface>
        <PageHeader title={title} subtitle={subtitle} actions={right} />
        <div className="space-y-6">{children}</div>
      </PageSurface>
    </div>
  );
}
