"use client";

import type { ReactNode } from "react";
import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";
import { GovConEntitlementGuard } from "@/components/dashboard/GovConEntitlementGuard";

/**
 * GovCon Layout - Client Component
 *
 * Wraps children in ClerkProviderWrapper (includes Clerk, Org, and UserProfile providers)
 * and GovConEntitlementGuard for entitlement checking.
 */
export default function GovConLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProviderWrapper>
      <GovConEntitlementGuard>{children}</GovConEntitlementGuard>
    </ClerkProviderWrapper>
  );
}
