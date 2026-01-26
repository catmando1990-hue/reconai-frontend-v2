"use client";

import Link from "next/link";
import { useState } from "react";
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
import { auditedFetch } from "@/lib/auditedFetch";
import {
  Sparkles,
  RefreshCw,
  Loader2,
  Clock,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import type {
  IntelligenceLifecycleStatus,
  IntelligenceReasonCode,
} from "@/lib/api/types";

/**
 * Intelligence Insights Page
 *
 * Claude-powered transaction analysis with actionable insights.
 * Includes confirm/dismiss functionality for categorization suggestions.
 */

// Extended insight type with suggested_category
interface InsightItem {
  id: string;
  type?: string;
  title: string;
  summary: string;
  confidence: number;
  source?: string;
  transaction_ids?: string[];
  suggested_category?: string;
  created_at?: string;
}

// =============================================================================
// LIFECYCLE STATUS BANNER
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
  if (lifecycle === "success") return null;

  if (lifecycle === "pending") {
    return (
      <div className="rounded-lg border border-border bg-muted p-4">
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

  if (lifecycle === "stale") {
    return (
      <div className="rounded-lg border border-border bg-muted p-4">
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

  return (
    <div className="rounded-lg border border-border bg-muted p-4">
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
// INSIGHT CARD WITH ACTIONS
// =============================================================================

interface InsightCardProps {
  item: InsightItem;
  onConfirm?: (transactionId: string, category: string) => Promise<void>;
  onDismiss?: (insightId: string) => void;
}

function InsightCard({ item, onConfirm, onDismiss }: InsightCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleConfirm = async () => {
    if (!item.suggested_category || !item.transaction_ids?.length) return;

    setConfirming(true);
    try {
      // Apply category to all transactions in this insight
      for (const txId of item.transaction_ids) {
        await onConfirm?.(txId, item.suggested_category);
      }
      setConfirmed(true);
    } catch (err) {
      console.error("Failed to confirm:", err);
    } finally {
      setConfirming(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.(item.id);
  };

  if (dismissed) return null;

  return (
    <div
      className={`rounded-lg border border-border bg-muted p-4 ${confirmed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium">{item.title}</h3>
            <SeverityBadge severity={severityFromConfidence(item.confidence)} />
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
          <p className="text-sm text-muted-foreground">{item.summary}</p>

          {/* Show suggested category if available */}
          {item.suggested_category && (
            <p className="text-sm">
              <span className="text-muted-foreground">Suggested: </span>
              <span className="font-medium text-primary">
                {item.suggested_category}
              </span>
            </p>
          )}

          {/* Show affected transactions */}
          {item.transaction_ids && item.transaction_ids.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {item.transaction_ids.length} transaction
              {item.transaction_ids.length > 1 ? "s" : ""} affected
            </p>
          )}

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

        {/* Action buttons for categorization insights */}
        {item.type === "categorization" &&
          item.suggested_category &&
          !confirmed && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleConfirm}
                disabled={confirming}
                className="text-primary border-primary hover:bg-primary/10"
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Apply
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                disabled={confirming}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

        {/* Show confirmed state */}
        {confirmed && (
          <span className="text-xs text-primary font-medium flex items-center gap-1">
            <Check className="h-4 w-4" />
            Applied
          </span>
        )}
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

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleConfirmCategory = async (
    transactionId: string,
    category: string,
  ) => {
    await auditedFetch(`/api/transactions/${transactionId}/category`, {
      method: "PATCH",
      body: JSON.stringify({ category }),
      skipBodyValidation: true,
    });
  };

  const handleDismiss = (insightId: string) => {
    setDismissedIds((prev) => new Set(prev).add(insightId));
  };

  // Filter out dismissed insights
  const visibleItems = (data?.items as InsightItem[] | null)?.filter(
    (item) => !dismissedIds.has(item.id),
  );

  return (
    <TierGate tier="intelligence" title="Insights">
      <RouteShell
        title="Insights"
        subtitle="AI-powered signals from your transaction data"
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
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Active Insights</h2>
                <p className="text-sm text-muted-foreground">
                  Claude-powered analysis of your transactions
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing transactions…
                </div>
              ) : lifecycle && lifecycle !== "success" ? (
                <LifecycleStatusBanner
                  lifecycle={lifecycle}
                  reasonCode={reasonCode}
                  reasonMessage={reasonMessage}
                  onRetry={() => void refetch()}
                />
              ) : isSuccess && visibleItems?.length ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Live
                    </span>
                    <span>
                      as of{" "}
                      {data?.generated_at
                        ? new Date(data.generated_at).toLocaleString()
                        : "recently"}
                    </span>
                  </div>

                  {visibleItems.map((item) => (
                    <InsightCard
                      key={item.id}
                      item={item}
                      onConfirm={handleConfirmCategory}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="No insights found"
                  description="Your transactions look good! No issues detected."
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
                  <span className="text-lg font-medium">
                    {visibleItems?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    High Confidence
                  </span>
                  <span className="text-lg font-medium">
                    {visibleItems?.filter((i) => i.confidence >= 0.85).length ??
                      0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Actionable
                  </span>
                  <span className="text-lg font-medium">
                    {visibleItems?.filter(
                      (i) =>
                        i.type === "categorization" && i.suggested_category,
                    ).length ?? 0}
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
