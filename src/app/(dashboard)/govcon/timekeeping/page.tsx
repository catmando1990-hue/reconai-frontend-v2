"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { STATUS } from "@/lib/dashboardCopy";
import { ROUTES } from "@/lib/routes";

/**
 * GovCon Timekeeping Page
 *
 * CANONICAL LAWS COMPLIANCE:
 * - No hardcoded zeros - show STATUS.NOT_CONFIGURED when no backend data
 * - No fake weekly grids with placeholder "0h" values
 * - No disabled buttons with "coming soon" - either functional or absent
 * - Fail-closed: if backend unavailable, show explicit unavailable state
 */
export default function TimekeepingPage() {
  // Backend integration not available - show honest empty state only
  // No fake summaries, grids, or navigation with hardcoded zeros

  return (
    <RouteShell
      title="Timekeeping"
      subtitle="DCAA-compliant labor tracking with daily time entry"
    >
      <PolicyBanner
        policy="accounting"
        message="Time must be recorded daily with 15-minute increments. Corrections require evidence and supervisory approval."
        context="govcon"
      />

      {/* BACKGROUND NORMALIZATION: GovCon uses bg-card (no bg-background) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Time Entry</h2>
          <p className="text-sm text-muted-foreground">
            {STATUS.NOT_CONFIGURED}
          </p>
        </div>
        <EmptyState
          icon={Clock}
          title="No time entries"
          description="Timekeeping requires contracts to be configured first. Connect your contract data source to enable DCAA-compliant time tracking."
        />
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            When configured, this page will display: weekly time grid, daily
            entry forms, contract allocation, and timesheet submission workflow.
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
    </RouteShell>
  );
}
