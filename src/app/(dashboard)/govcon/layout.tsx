"use client";

import type { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";
import { GovConEntitlementGuard } from "@/components/dashboard/GovConEntitlementGuard";

/**
 * GovCon Layout
 *
 * GovCon pages must be entitlement-gated and remain isolated.
 * Uses V2 shell with entitlement guard preserved.
 */
export default function GovConLayout({ children }: { children: ReactNode }) {
  return (
    <GovConEntitlementGuard>
      <ShellV2 module="govcon">{children}</ShellV2>
    </GovConEntitlementGuard>
  );
}
