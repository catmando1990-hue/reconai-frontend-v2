"use client";

import Link from "next/link";
import { useState } from "react";
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
 * Design: Self-contained dual-mode (light/dark) hex colors.
 */

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
      <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] p-4">
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-[#6b7280] dark:text-[#a1a1aa] animate-spin shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#111827] dark:text-[#f9fafb]">
              Computing insights…
            </p>
            {reasonMessage && (
              <p className="mt-1 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
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
      <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#111827] dark:text-[#f9fafb]">
              Insights data is stale
            </p>
            <p className="mt-1 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
              {reasonMessage || `Reason: ${reasonCode || "unknown"}`}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#111827] dark:text-[#f9fafb] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[#111827] dark:text-[#f9fafb]">
            Insights unavailable
          </p>
          <p className="mt-1 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
            {reasonMessage || `Error: ${reasonCode || "unknown"}`}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#111827] dark:text-[#f9fafb] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
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
      className={`rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] p-4 ${confirmed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-[#111827] dark:text-[#f9fafb]">{item.title}</h3>
            <SeverityBadge severity={severityFromConfidence(item.confidence)} />
            <span className="inline-flex items-center rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-2 py-0.5 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
              {item.source === "rules"
                ? "Rule-based"
                : item.source === "ml"
                  ? "ML model"
                  : item.source === "llm"
                    ? "AI-generated"
                    : "Hybrid"}
            </span>
          </div>
          <p className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">{item.summary}</p>

          {item.suggested_category && (
            <p className="text-sm">
              <span className="text-[#6b7280] dark:text-[#a1a1aa]">Suggested: </span>
              <span className="font-medium text-[#4f46e5] dark:text-[#6366f1]">
                {item.suggested_category}
              </span>
            </p>
          )}

          {item.transaction_ids && item.transaction_ids.length > 0 && (
            <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
              {item.transaction_ids.length} transaction
              {item.transaction_ids.length > 1 ? "s" : ""} affected
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
            <ConfidenceMeta confidence={item.confidence} />
            <span className="text-[#6b7280]/60 dark:text-[#a1a1aa]/60">•</span>
            <span>
              {item.created_at
                ? new Date(item.created_at).toLocaleString()
                : "Time unknown"}
            </span>
          </div>
        </div>

        {item.type === "categorization" &&
          item.suggested_category &&
          !confirmed && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium border border-[#4f46e5] dark:border-[#6366f1] text-[#4f46e5] dark:text-[#6366f1] hover:bg-[#4f46e5]/10 dark:hover:bg-[#6366f1]/10 disabled:opacity-50 transition-colors"
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Apply
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                disabled={confirming}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

        {confirmed && (
          <span className="text-xs text-[#4f46e5] dark:text-[#6366f1] font-medium flex items-center gap-1">
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

  const visibleItems = (data?.items as InsightItem[] | null)?.filter(
    (item) => !dismissedIds.has(item.id),
  );

  return (
    <TierGate tier="intelligence" title="Insights">
      <RouteShell
        title="Insights"
        subtitle="AI-powered signals from your transaction data"
        right={
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium bg-[#f3f4f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f9fafb] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        }
      >
        <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#111827] dark:text-[#f9fafb]">Active Insights</h2>
                <p className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                  Claude-powered analysis of your transactions
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-[#6b7280] dark:text-[#a1a1aa]">
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
                  <div className="flex items-center gap-2 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] px-2 py-0.5 text-[#111827] dark:text-[#f9fafb]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4f46e5] dark:bg-[#6366f1]" />
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

            <div className="mt-6">
              <IntelligenceV1Panel />
            </div>
          </div>

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title="Insight Summary">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                    Total Insights
                  </span>
                  <span className="text-lg font-medium text-[#111827] dark:text-[#f9fafb]">
                    {visibleItems?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                    High Confidence
                  </span>
                  <span className="text-lg font-medium text-[#111827] dark:text-[#f9fafb]">
                    {visibleItems?.filter((i) => i.confidence >= 0.85).length ??
                      0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">
                    Actionable
                  </span>
                  <span className="text-lg font-medium text-[#111827] dark:text-[#f9fafb]">
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
                  <span className="text-[#6b7280] dark:text-[#a1a1aa]">High (≥0.85)</span>
                  <span className="text-[#4f46e5] dark:text-[#6366f1]">Actionable</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6b7280] dark:text-[#a1a1aa]">
                    Medium (0.70-0.84)
                  </span>
                  <span className="text-[#111827] dark:text-[#f9fafb]">Review recommended</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6b7280] dark:text-[#a1a1aa]">Low (&lt;0.70)</span>
                  <span className="text-[#6b7280] dark:text-[#a1a1aa]">
                    Flagged for verification
                  </span>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Quick Links" collapsible>
              <div className="space-y-2 text-sm">
                <Link
                  href={ROUTES.INTELLIGENCE_ALERTS}
                  className="block text-[#4f46e5] dark:text-[#6366f1] hover:underline"
                >
                  View alerts
                </Link>
                <Link
                  href={ROUTES.CORE_TRANSACTIONS}
                  className="block text-[#4f46e5] dark:text-[#6366f1] hover:underline"
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
