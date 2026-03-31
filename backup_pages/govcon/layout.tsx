"use client";

import type { ReactNode } from "react";
import { GovConEntitlementGuard } from "@/components/dashboard/GovConEntitlementGuard";

/**
 * GovCon Layout
 *
 * GovCon pages must be entitlement-gated.
 * Shell is now handled at the (dashboard) level.
 */
export default function GovConLayout({ children }: { children: ReactNode }) {
  return <GovConEntitlementGuard>{children}</GovConEntitlementGuard>;
}
