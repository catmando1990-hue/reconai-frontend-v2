"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
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
        data-testid="intelligence-lifecycle-banner"
        data-lifecycle="pending"
        className="rounded-lg border border-border bg-muted p-4"
      >
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Computing insights…
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
        data-testid="intelligence-lifecycle-banner"
        data-lifecycle="stale"
        className="rounded-lg border border-border bg-muted p-4"
      >
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Insights data is stale
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
      data-testid="intelligence-lifecycle-banner"
      data-lifecycle="failed"
      className="rounded-lg border border-border bg-muted p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Insights unavailable
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
            {/* BACKGROUND NORMALIZATION: No decorative colors */}
            {isDemo && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
        {/* BACKGROUND NORMALIZATION: No decorative colors */}
        {isDemo && demoDisclaimer && (
          <div className="mb-4 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            {demoDisclaimer}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* BACKGROUND NORMALIZATION: Intelligence is ADVISORY (no bg-background) */}
          {/* Main content uses bg-card, inner items use bg-muted */}
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Active Insights</h2>
                <p className="text-sm text-muted-foreground">
                  AI-generated signals requiring review
                </p>
              </div>
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
                  {/* Lifecycle indicator - inline with insights (no decorative colors) */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
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
                      className="rounded-lg border border-border bg-muted p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{item.title}</h3>
                            <SeverityBadge
                              severity={severityFromConfidence(item.confidence)}
                            />
                            {/* Source label: communicates HOW the insight was generated */}
                            <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
                              {item.source === "rules"
                                ? "Rule-based"
                                : item.source === "ml"
                                  ? "ML model"
                                  : item.source === "llm"
                                    ? "AI-generated"
                                    : "Hybrid"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.summary}
                          </p>
                          {/* HIERARCHY: Confidence prominent + freshness inline */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <ConfidenceMeta confidence={item.confidence} />
                            <span className="text-muted-foreground/60">•</span>
                            <span>
                              {item.created_at
                                ? new Date(item.created_at).toLocaleString()
                                : "Time unknown"}
                            </span>
                          </div>
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
            </div>

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
                      <span className="capitalize font-medium">
                        {lifecycle}
                      </span>
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
