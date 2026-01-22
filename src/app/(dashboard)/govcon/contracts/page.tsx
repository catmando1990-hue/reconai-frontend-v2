"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { STATUS } from "@/lib/dashboardCopy";
import { ROUTES } from "@/lib/routes";

/**
 * GovCon Contracts Page
 *
 * CANONICAL LAWS COMPLIANCE:
 * - No hardcoded zeros - show STATUS.NOT_CONFIGURED when no backend data
 * - No placeholder summaries - section doesn't render without real data
 * - Fail-closed: if backend unavailable, show explicit unavailable state
 */
export default function ContractsPage() {
  // Backend integration not available - show honest empty state only
  // No fake summaries with hardcoded zeros

  return (
    <RouteShell
      title="Contracts"
      subtitle="DCAA-compliant contract tracking with CLIN management"
    >
      {/* BACKGROUND NORMALIZATION: GovCon uses bg-card (no bg-background) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Contract Management</h2>
          <p className="text-sm text-muted-foreground">{STATUS.NOT_CONFIGURED}</p>
        </div>
        <EmptyState
          icon={FileText}
          title="No contracts"
          description="Contract management requires backend integration. Connect your contract data source to track DCAA-compliant contracts and CLINs."
        />
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            When configured, this page will display: contract list, CLIN
            tracking, funding status, and billing summaries.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href={ROUTES.GOVCON_AUDIT}
              className="text-xs text-primary hover:underline"
            >
              View audit trail
            </Link>
            <span className="text-xs text-muted-foreground">•</span>
            <Link
              href={ROUTES.GOVCON}
              className="text-xs text-primary hover:underline"
            >
              GovCon overview
            </Link>
          </div>
        </div>
      </div>
    </RouteShell>
  );
}
