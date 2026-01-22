"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useCfoSnapshot } from "@/hooks/useCfoSnapshot";
import { TierGate } from "@/components/legal/TierGate";
import { AI_DISCLAIMER, REGULATORY_DISCLAIMER } from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import {
  FileText,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import type { CfoLifecycleStatus, CfoReasonCode } from "@/lib/api/types";

/**
 * CFO Executive Summary Page
 *
 * P0 FIX: Version and Lifecycle Enforcement
 * - Unknown/missing cfo_version = fail-closed (no data rendered)
 * - Non-success lifecycle REQUIRES reason display
 * - Snapshot data only rendered when lifecycle is "success"
 */

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return `$${value.toLocaleString()}`;
}

// =============================================================================
// LIFECYCLE STATUS BANNER - Required for non-success states
// =============================================================================

/**
 * Lifecycle Status Banner - Required for non-success states
 * PART 2: Non-success requires reason display
 */
interface LifecycleStatusBannerProps {
  lifecycle: CfoLifecycleStatus;
  reasonCode: CfoReasonCode | null;
  reasonMessage: string | null;
  onRetry?: () => void;
}

/**
 * BACKGROUND NORMALIZATION: Lifecycle banners use border-only styling
 * No decorative colors - borders over backgrounds
 */
function LifecycleStatusBanner({
  lifecycle,
  reasonCode,
  reasonMessage,
  onRetry,
}: LifecycleStatusBannerProps) {
  // Success state - no banner needed
  if (lifecycle === "success") {
    return null;
  }

  // Pending state - show loading indicator (border only)
  if (lifecycle === "pending") {
    return (
      <div
        data-testid="cfo-lifecycle-banner"
        data-lifecycle="pending"
        className="rounded-lg border border-border bg-card p-4"
      >
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Computing CFO snapshot…
            </p>
            {reasonMessage && (
              <p className="mt-1 text-xs text-muted-foreground">
                {reasonMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Stale state - show warning with reason (border only)
  if (lifecycle === "stale") {
    return (
      <div
        data-testid="cfo-lifecycle-banner"
        data-lifecycle="stale"
        className="rounded-lg border border-border bg-card p-4"
      >
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              CFO data is stale
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {reasonMessage || `Reason: ${reasonCode || "unknown"}`}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Failed state - show error with reason (border only)
  return (
    <div
      data-testid="cfo-lifecycle-banner"
      data-lifecycle="failed"
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            CFO snapshot unavailable
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {reasonMessage || `Error: ${reasonCode || "unknown"}`}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ExecutiveSummaryBody() {
  const {
    data,
    isLoading,
    isSuccess,
    lifecycle,
    reasonCode,
    reasonMessage,
    refetch,
  } = useCfoSnapshot();

  return (
    <RouteShell
      title="Executive Summary"
      subtitle="CFO-grade snapshot for decision-making: risks, actions, and runway posture"
      right={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refetch()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
    >
      <div className="space-y-2">
        <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>
        <DisclaimerNotice>{REGULATORY_DISCLAIMER}</DisclaimerNotice>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Executive Metrics */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Financial Posture"
            subtitle="Key metrics for executive decision-making"
          >
            {/* P0 FIX: Lifecycle-based rendering */}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading executive summary…
              </p>
            ) : lifecycle && lifecycle !== "success" ? (
              /* PART 2: Non-success lifecycle shows banner with reason */
              <div className="space-y-4">
                <LifecycleStatusBanner
                  lifecycle={lifecycle}
                  reasonCode={reasonCode}
                  reasonMessage={reasonMessage}
                  onRetry={() => void refetch()}
                />
                {/* Show stale data if available during stale/pending states */}
                {lifecycle === "stale" && data?.snapshot && (
                  <div className="opacity-60">
                    <p className="text-xs text-muted-foreground mb-4 italic">
                      Showing stale data (last updated:{" "}
                      {data.snapshot.as_of
                        ? new Date(data.snapshot.as_of).toLocaleString()
                        : "unknown"}
                      )
                    </p>
                    {/* Stale metrics grid - bg-muted (subordinate) */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-border bg-muted p-5">
                        <p className="text-sm text-muted-foreground">Runway</p>
                        {data.snapshot.runway_days !== null ? (
                          <p className="mt-1 text-2xl font-medium">
                            {data.snapshot.runway_days} days
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground italic">
                            Insufficient data
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg border border-border bg-muted p-5">
                        <p className="text-sm text-muted-foreground">
                          Cash on Hand
                        </p>
                        {data.snapshot.cash_on_hand !== null ? (
                          <p className="mt-1 text-2xl font-medium">
                            {formatCurrency(data.snapshot.cash_on_hand)}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground italic">
                            Awaiting data
                          </p>
                        )}
                      </div>
                      <div className="rounded-lg border border-border bg-muted p-5">
                        <p className="text-sm text-muted-foreground">
                          Monthly Burn
                        </p>
                        {data.snapshot.burn_rate_monthly !== null ? (
                          <p className="mt-1 text-2xl font-medium">
                            {formatCurrency(data.snapshot.burn_rate_monthly)}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground italic">
                            Awaiting data
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isSuccess && data?.snapshot ? (
              /* SUCCESS: Render full snapshot data */
              <div className="space-y-6" data-testid="cfo-snapshot-content">
                {/* Lifecycle indicator - border only, no decorative colors */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    Live
                  </span>
                  <span>
                    as of{" "}
                    {data.snapshot.as_of
                      ? new Date(data.snapshot.as_of).toLocaleString()
                      : "recently"}
                  </span>
                </div>

                {/* Key Metrics Grid - bg-muted (subordinate to PrimaryPanel) */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted p-5">
                    <p className="text-sm text-muted-foreground">Runway</p>
                    {data.snapshot.runway_days !== null ? (
                      <p className="mt-1 text-2xl font-medium">
                        {data.snapshot.runway_days} days
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground italic">
                        Insufficient data to calculate
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-muted p-5">
                    <p className="text-sm text-muted-foreground">
                      Cash on Hand
                    </p>
                    {data.snapshot.cash_on_hand !== null ? (
                      <p className="mt-1 text-2xl font-medium">
                        {formatCurrency(data.snapshot.cash_on_hand)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground italic">
                        Awaiting bank data
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-muted p-5">
                    <p className="text-sm text-muted-foreground">
                      Monthly Burn
                    </p>
                    {data.snapshot.burn_rate_monthly !== null ? (
                      <p className="mt-1 text-2xl font-medium">
                        {formatCurrency(data.snapshot.burn_rate_monthly)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground italic">
                        Requires 30+ days of data
                      </p>
                    )}
                  </div>
                </div>

                {/* Risks Section - bg-muted (subordinate) */}
                <div className="rounded-lg border border-border bg-muted p-5">
                  <h3 className="text-sm font-semibold mb-3">Top Risks</h3>
                  {data.snapshot.top_risks.length ? (
                    <ul className="space-y-2">
                      {data.snapshot.top_risks.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          {r.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No active risks detected.
                    </p>
                  )}
                </div>

                {/* Actions Section - bg-muted (subordinate) */}
                <div className="rounded-lg border border-border bg-muted p-5">
                  <h3 className="text-sm font-semibold mb-3">Next Actions</h3>
                  {data.snapshot.next_actions.length ? (
                    <ul className="space-y-3">
                      {data.snapshot.next_actions.map((a) => (
                        <li key={a.id} className="space-y-1">
                          <p className="text-sm flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            {a.title}
                          </p>
                          <p className="text-xs text-muted-foreground ml-6">
                            {a.rationale}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No recommended actions at this time.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* EMPTY STATE: No data available */
              <EmptyState
                icon={FileText}
                title="No CFO snapshot available"
                description="Connect banks and complete onboarding to generate a baseline executive summary."
              />
            )}
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Summary Stats">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Risk Count
                </span>
                {/* P0 FIX: Show reason when data unavailable, not bare dash */}
                {isSuccess && data?.snapshot ? (
                  <span className="text-lg font-medium">
                    {data.snapshot.top_risks.length}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    {lifecycle === "pending" ? "Loading" : "No data"}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pending Actions
                </span>
                {isSuccess && data?.snapshot ? (
                  <span className="text-lg font-medium">
                    {data.snapshot.next_actions.length}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    {lifecycle === "pending" ? "Loading" : "No data"}
                  </span>
                )}
              </div>
              {/* Show lifecycle status in sidebar */}
              {lifecycle && lifecycle !== "success" && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Status:{" "}
                    <span className="capitalize font-medium">{lifecycle}</span>
                  </p>
                </div>
              )}
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Report Usage">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This executive summary is designed for board meetings, investor
                updates, and executive decision-making.
              </p>
              <p>
                All metrics are calculated from connected financial data sources
                and updated on refresh.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.CFO_COMPLIANCE}
                className="block text-primary hover:underline"
              >
                View compliance
              </Link>
              <Link
                href={ROUTES.CFO_OVERVIEW}
                className="block text-primary hover:underline"
              >
                CFO overview
              </Link>
              <Link
                href={ROUTES.CFO_FINANCIAL_REPORTS}
                className="block text-primary hover:underline"
              >
                Financial reports
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function CfoExecutiveSummaryPage() {
  return (
    <TierGate
      tier="cfo"
      title="Executive Summary"
      subtitle="Upgrade or request access to unlock CFO tools."
    >
      <ExecutiveSummaryBody />
    </TierGate>
  );
}
