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
import { Sparkles, RefreshCw } from "lucide-react";

export default function IntelligenceInsightsPage() {
  const { data, isLoading, error, refetch } = useInsightsSummary();

  return (
    <TierGate tier="intelligence" title="Insights">
      <RouteShell
        title="Insights"
        subtitle="Decision-grade signals surfaced from transaction behavior and operating patterns"
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
        <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>

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
                  <span className="text-lg font-semibold">
                    {data?.items?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    High Confidence
                  </span>
                  <span className="text-lg font-semibold">
                    {data?.items?.filter((i) => i.confidence >= 0.85).length ??
                      0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Needs Review
                  </span>
                  <span className="text-lg font-semibold">
                    {data?.items?.filter((i) => i.confidence < 0.85).length ??
                      0}
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
                  href="/intelligence/alerts"
                  className="block text-primary hover:underline"
                >
                  View alerts
                </Link>
                <Link
                  href="/intelligence/ai-worker"
                  className="block text-primary hover:underline"
                >
                  AI Worker tasks
                </Link>
                <Link
                  href="/core/transactions"
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
