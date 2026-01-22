"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { ConfidenceMeta } from "@/components/dashboard/ConfidenceMeta";
import { useInsightsSummary } from "@/hooks/useInsightsSummary";
import { AI_DISCLAIMER } from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { severityFromConfidence } from "@/lib/scoring";
import { TierGate } from "@/components/legal/TierGate";
import { IntelligenceV1Panel } from "@/components/intelligence/IntelligenceV1Panel";
import {
  Sparkles,
  RefreshCw,
  FlaskConical,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import type {
  IntelligenceLifecycleStatus,
  IntelligenceReasonCode,
} from "@/lib/api/types";

/**
 * Intelligence Insights Page
 *
 * P0 FIX: Version and Lifecycle Enforcement
 * - Unknown/missing intelligence_version = fail-closed (no data rendered)
 * - Non-success lifecycle REQUIRES reason display
 * - Insights data only rendered when lifecycle is "success"
 */

// =============================================================================
// LIFECYCLE STATUS BANNER - Required for non-success states
// =============================================================================

interface LifecycleStatusBannerProps {
  lifecycle: IntelligenceLifecycleStatus;
  reasonCode: IntelligenceReasonCode | null;
  reasonMessage: string | null;
  onRetry?: () => void;
}

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

  // Pending state - show loading indicator
  if (lifecycle === "pending") {
    return (
      <div
        data-testid="intelligence-lifecycle-banner"
        data-lifecycle="pending"
        className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Computing insights…
            </p>
            {reasonMessage && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {reasonMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Stale state - show warning with reason
  if (lifecycle === "stale") {
    return (
      <div
        data-testid="intelligence-lifecycle-banner"
        data-lifecycle="stale"
        className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              Insights data is stale
            </p>
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
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

  // Failed state - show error with reason (REQUIRED)
  return (
    <div
      data-testid="intelligence-lifecycle-banner"
      data-lifecycle="failed"
      className="rounded-lg border border-red-500/30 bg-red-500/10 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Insights unavailable
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
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

export default function IntelligenceInsightsPage() {
  const {
    data,
    isLoading,
    isSuccess,
    lifecycle,
    reasonCode,
    reasonMessage,
    refetch,
  } = useInsightsSummary();

  // P0 FIX: Check for demo mode flag from fetcher
  const isDemo = (data as { _isDemo?: boolean })?._isDemo ?? false;
  const demoDisclaimer = (data as { _demoDisclaimer?: string })
    ?._demoDisclaimer;

  return (
    <TierGate tier="intelligence" title="Insights">
      <RouteShell
        title="Insights"
        subtitle="Decision-grade signals surfaced from transaction behavior and operating patterns"
        right={
          <div className="flex items-center gap-2">
            {/* P0 FIX: Show Demo badge when data is from mock */}
            {isDemo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                <FlaskConical className="h-3 w-3" />
                Demo
              </span>
            )}
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
          </div>
        }
      >
        <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>

        {/* P0 FIX: Show demo disclaimer when in demo mode */}
        {isDemo && demoDisclaimer && (
          <div className="mb-4 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs text-purple-600 dark:text-purple-400">
            {demoDisclaimer}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Primary Panel - Insights List */}
          <div className="lg:col-span-8">
            <PrimaryPanel
              title="Active Insights"
              subtitle="AI-generated signals requiring review"
            >
              {/* P0 FIX: Lifecycle-based rendering */}
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading insights…
                </p>
              ) : lifecycle && lifecycle !== "success" ? (
                /* PART 2: Non-success lifecycle shows banner with reason */
                <LifecycleStatusBanner
                  lifecycle={lifecycle}
                  reasonCode={reasonCode}
                  reasonMessage={reasonMessage}
                  onRetry={() => void refetch()}
                />
              ) : isSuccess && data?.items?.length ? (
                /* SUCCESS: Render insights data */
                <div className="space-y-4" data-testid="insights-content">
                  {/* Lifecycle indicator - inline with insights */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-green-700 dark:text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Live
                    </span>
                    <span>
                      as of{" "}
                      {data.generated_at
                        ? new Date(data.generated_at).toLocaleString()
                        : "recently"}
                    </span>
                  </div>

                  {data.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{item.title}</h3>
                            <SeverityBadge
                              severity={severityFromConfidence(item.confidence)}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.summary}
                          </p>
                          <ConfidenceMeta confidence={item.confidence} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* EMPTY STATE: No insights available */
                <EmptyState
                  icon={Sparkles}
                  title="No insights yet"
                  description="Connect a bank and upload transactions to generate signals."
                />
              )}
            </PrimaryPanel>

            {/* Intelligence V1 Panel */}
            <div className="mt-6">
              <IntelligenceV1Panel />
            </div>
          </div>

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title="Insight Summary">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Insights
                  </span>
                  {/* P0 FIX: Show reason when data unavailable */}
                  {isSuccess && data?.items ? (
                    <span className="text-lg font-medium">
                      {data.items.length}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      {lifecycle === "pending" ? "Loading" : "No data"}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    High Confidence
                  </span>
                  {isSuccess && data?.items ? (
                    <span className="text-lg font-medium">
                      {data.items.filter((i) => i.confidence >= 0.85).length}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      {lifecycle === "pending" ? "Loading" : "No data"}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Needs Review
                  </span>
                  {isSuccess && data?.items ? (
                    <span className="text-lg font-medium">
                      {data.items.filter((i) => i.confidence < 0.85).length}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      {lifecycle === "pending" ? "Loading" : "No data"}
                    </span>
                  )}
                </div>
                {/* Show lifecycle status when non-success */}
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

            <SecondaryPanel title="Confidence Thresholds">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">High (≥0.85)</span>
                  <span className="text-primary">Actionable</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Medium (0.70-0.84)
                  </span>
                  <span className="text-foreground">Review recommended</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Low (&lt;0.70)</span>
                  <span className="text-muted-foreground">
                    Flagged for verification
                  </span>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Quick Links" collapsible>
              <div className="space-y-2 text-sm">
                <Link
                  href={ROUTES.INTELLIGENCE_ALERTS}
                  className="block text-primary hover:underline"
                >
                  View alerts
                </Link>
                <Link
                  href={ROUTES.INTELLIGENCE_AI_WORKER}
                  className="block text-primary hover:underline"
                >
                  AI Worker tasks
                </Link>
                <Link
                  href={ROUTES.CORE_TRANSACTIONS}
                  className="block text-primary hover:underline"
                >
                  Review transactions
                </Link>
              </div>
            </SecondaryPanel>
          </div>
        </div>
      </RouteShell>
    </TierGate>
  );
}
