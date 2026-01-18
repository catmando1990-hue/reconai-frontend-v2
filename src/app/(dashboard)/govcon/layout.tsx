"use client";

import type { ReactNode } from "react";
import { GovConEntitlementGuard } from "@/components/dashboard/GovConEntitlementGuard";

/**
 * GovCon Layout
 *
 * GovCon pages must be entitlement-gated and remain isolated.
 * Visual hierarchy is owned by per-route RouteShell to prevent drift.
 */
export default function GovConLayout({ children }: { children: ReactNode }) {
  return <GovConEntitlementGuard>{children}</GovConEntitlementGuard>;
}
