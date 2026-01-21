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
import { Sparkles, RefreshCw, FlaskConical } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { STATUS } from "@/lib/dashboardCopy";

export default function IntelligenceInsightsPage() {
  const { data, isLoading, error, refetch } = useInsightsSummary();

  // P0 FIX: Check for demo mode flag from fetcher
  const isDemo = (data as { _isDemo?: boolean })?._isDemo ?? false;
  const demoDisclaimer = (data as { _demoDisclaimer?: string })?._demoDisclaimer;

  // P0 FIX: Helper to format counts - show "—" for null/undefined, not 0
  const formatCount = (count: number | null | undefined): string => {
    if (count === null || count === undefined) return STATUS.NO_DATA;
    return String(count);
  };

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
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading insights…
                </p>
              ) : error ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : data?.items?.length ? (
                <div className="space-y-4">
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
                  {/* P0 FIX: Show "No data" instead of 0 when data unavailable */}
                  <span className="text-lg font-semibold">
                    {formatCount(data?.items?.length)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    High Confidence
                  </span>
                  {/* P0 FIX: Show "No data" instead of 0 when data unavailable */}
                  <span className="text-lg font-semibold">
                    {data?.items
                      ? formatCount(
                          data.items.filter((i) => i.confidence >= 0.85).length
                        )
                      : STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Needs Review
                  </span>
                  {/* P0 FIX: Show "No data" instead of 0 when data unavailable */}
                  <span className="text-lg font-semibold">
                    {data?.items
                      ? formatCount(
                          data.items.filter((i) => i.confidence < 0.85).length
                        )
                      : STATUS.NO_DATA}
                  </span>
                </div>
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
