"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { Building2, Lock, ArrowRight } from "lucide-react";
import { useUserProfile } from "@/lib/user-profile-context";
import { hasGovConEntitlement } from "@/lib/entitlements";

/**
 * GovCon Entitlement Guard - Client Component
 *
 * Checks GovCon entitlement before rendering children.
 * Non-entitled users see a clean upgrade panel, not an error.
 */
export function GovConEntitlementGuard({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();

  const isEntitled = useMemo(
    () => hasGovConEntitlement(profile?.tiers, profile?.role),
    [profile?.tiers, profile?.role],
  );

  // Show loading state while profile is not yet available
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">
          Checking access...
        </div>
      </div>
    );
  }

  // Non-entitled users see upgrade panel
  if (!isEntitled) {
    return (
      <main className="p-6 flex items-center justify-center min-h-[600px]">
        <div className="max-w-md w-full">
          <div className="rounded-2xl border bg-card p-8 text-center">
            {/* Lock Icon */}
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Lock className="h-8 w-8 text-primary" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold mb-2">GovCon Module</h1>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              The GovCon module provides DCAA-compliant government contracting
              tools including contract management, timekeeping, indirect cost
              pools, reconciliation, and audit trail management.
            </p>

            {/* Feature List */}
            <div className="text-left mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Contract & CLIN Management</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                <span>DCAA-Compliant Timekeeping</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Indirect Cost Pool Management</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Labor & Indirect Reconciliation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Immutable Audit Trail</span>
              </div>
            </div>

            {/* Entitlement Info */}
            <div className="p-4 rounded-lg bg-muted/50 mb-6">
              <p className="text-sm text-muted-foreground">
                This module requires{" "}
                <span className="font-medium text-foreground">GovCon</span>,{" "}
                <span className="font-medium text-foreground">Contractor</span>,
                or{" "}
                <span className="font-medium text-foreground">Enterprise</span>{" "}
                tier.
              </p>
            </div>

            {/* Upgrade CTA */}
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Upgrade to Access
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Back Link */}
            <Link
              href="/dashboard"
              className="inline-block mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Entitled users see the GovCon content
  return <>{children}</>;
}
