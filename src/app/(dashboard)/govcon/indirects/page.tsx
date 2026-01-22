"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { STATUS } from "@/lib/dashboardCopy";
import { ROUTES } from "@/lib/routes";

/**
 * GovCon Indirect Costs Page
 *
 * CANONICAL LAWS COMPLIANCE:
 * - No hardcoded zeros - show STATUS.NOT_CONFIGURED when no backend data
 * - No fake rate summaries or progress bars
 * - No disabled buttons with "coming soon" - either functional or absent
 * - Fail-closed: if backend unavailable, show explicit unavailable state
 */
export default function IndirectsPage() {
  // Backend integration not available - show honest empty state only
  // No fake summaries with hardcoded zeros

  return (
    <RouteShell
      title="Indirect Costs"
      subtitle="DCAA-compliant indirect rate management with FAR 31.201 allowability tracking"
    >
      <PolicyBanner
        policy="accounting"
        message="All indirect costs are reviewed against FAR 31.201-2 through 31.205-52 for allowability determination. Rate changes require evidence and are logged to the audit trail."
        context="govcon"
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* BACKGROUND NORMALIZATION: GovCon uses bg-card (no bg-background) */}
        <div className="lg:col-span-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Indirect Cost Pools</h2>
              <p className="text-sm text-muted-foreground">{STATUS.NOT_CONFIGURED}</p>
            </div>
            <EmptyState
              icon={Layers}
              title="No indirect pools"
              description="Indirect cost pool management requires backend integration. Connect your cost accounting data source to track FAR 31.201 allowability."
            />
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                When configured, this page will display: cost pool management,
                allowability determination, rate calculations, and audit trail.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={ROUTES.GOVCON_CONTRACTS}
                  className="text-xs text-primary hover:underline"
                >
                  Configure contracts
                </Link>
                <span className="text-xs text-muted-foreground">•</span>
                <Link
                  href={ROUTES.GOVCON_AUDIT}
                  className="text-xs text-primary hover:underline"
                >
                  Audit trail
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Panel - FAR Reference Only (static reference content, not fake data) */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="FAR Reference" collapsible>
            <div className="space-y-2 text-sm">
              <div className="p-2 rounded bg-muted">
                <p className="font-medium">FAR 31.205-6</p>
                <p className="text-xs text-muted-foreground">
                  Compensation (subject to reasonableness)
                </p>
              </div>
              <div className="p-2 rounded bg-muted">
                <p className="font-medium">FAR 31.205-14</p>
                <p className="text-xs text-muted-foreground">
                  Entertainment (generally unallowable)
                </p>
              </div>
              <div className="p-2 rounded bg-muted">
                <p className="font-medium">FAR 31.205-36</p>
                <p className="text-xs text-muted-foreground">
                  Rental costs (allowable if reasonable)
                </p>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.GOVCON_RECONCILIATION}
                className="block text-primary hover:underline"
              >
                Run reconciliation
              </Link>
              <Link
                href={ROUTES.GOVCON_AUDIT}
                className="block text-primary hover:underline"
              >
                View audit trail
              </Link>
              <Link
                href={ROUTES.GOVCON_CONTRACTS}
                className="block text-primary hover:underline"
              >
                View contracts
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
