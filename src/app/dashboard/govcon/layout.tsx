"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";
import { GovConEntitlementGuard } from "@/components/dashboard/GovConEntitlementGuard";

/**
 * GovCon Layout - Client Component
 *
 * Wraps children in ClerkProviderWrapper (includes Clerk, Org, and UserProfile providers)
 * and GovConEntitlementGuard for entitlement checking.
 * Adds back navigation to dashboard.
 */
export default function GovConLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProviderWrapper>
      <GovConEntitlementGuard>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <span aria-hidden="true">←</span>
              <span>Back to Dashboard</span>
            </Link>

            <p className="text-xs text-muted-foreground">
              GovCon is advisory-only. No actions are taken automatically.
            </p>
          </div>

          {children}
        </div>
      </GovConEntitlementGuard>
    </ClerkProviderWrapper>
  );
}
