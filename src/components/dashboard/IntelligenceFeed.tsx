"use client";

import { useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Insight, InsightSeverity } from "@/lib/api/types";

/**
 * IntelligenceFeed - Intelligence insights panel (30% width)
 *
 * CANONICAL LAWS:
 * - Manual refresh button only (no auto fetch loops)
 * - Confidence gated (>=0.85 highlighted)
 * - Advisory-only disclaimer
 * - Token-only colors
 * - Each item includes confidence badge, explanation, evidence action
 */

interface IntelligenceFeedProps {
  items: Insight[] | null;
  loading?: boolean;
  lifecycle?: "success" | "pending" | "failed" | "stale" | null;
  reasonMessage?: string | null;
  onRefresh?: () => void;
  className?: string;
}

// Confidence badge component
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const isHighConfidence = confidence >= 0.85;

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium font-mono tabular-nums",
        isHighConfidence
          ? "bg-chart-1/10 text-chart-1 border border-chart-1/20"
          : "bg-muted text-muted-foreground",
      )}
      title={`AI confidence: ${percentage}%`}
    >
      {percentage}%
    </span>
  );
}

// Severity icon component
function SeverityIcon({ severity }: { severity: InsightSeverity }) {
  switch (severity) {
    case "high":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "medium":
      return <AlertTriangle className="h-4 w-4 text-chart-4" />;
    case "low":
      return <CheckCircle className="h-4 w-4 text-chart-1" />;
    default:
      return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
  }
}

// Single insight item
function InsightItem({ insight }: { insight: Insight }) {
  return (
    <div className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div className="mt-0.5">
          <SeverityIcon severity={insight.severity} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ConfidenceBadge confidence={insight.confidence} />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {insight.type.replace(/_/g, " ")}
            </span>
          </div>
          <h4 className="text-sm font-medium text-foreground line-clamp-2">
            {insight.title}
          </h4>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 pl-6">
        {insight.summary}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between pl-6">
        <span className="text-[10px] text-muted-foreground">
          {new Date(insight.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <Link
          href={`/intelligence/insights?id=${insight.id}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          View Evidence
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({
  lifecycle,
  reasonMessage,
}: {
  lifecycle?: string | null;
  reasonMessage?: string | null;
}) {
  const getMessage = () => {
    if (lifecycle === "pending") {
      return {
        title: "Generating Insights",
        description: "AI analysis in progress...",
      };
    }
    if (lifecycle === "failed") {
      return {
        title: "Analysis Unavailable",
        description:
          reasonMessage || "Unable to generate insights at this time.",
      };
    }
    if (lifecycle === "stale") {
      return {
        title: "Insights Outdated",
        description: "Run analysis to get fresh insights.",
      };
    }
    return {
      title: "No Insights Yet",
      description: "Run Intelligence analysis to generate insights.",
    };
  };

  const message = getMessage();

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">
        {message.title}
      </p>
      <p className="text-xs text-muted-foreground text-center">
        {message.description}
      </p>
      <Link href="/intelligence" className="mt-4">
        <Button size="sm" variant="outline">
          Open Intelligence
        </Button>
      </Link>
    </div>
  );
}

export function IntelligenceFeed({
  items,
  loading = false,
  lifecycle,
  reasonMessage,
  onRefresh,
  className,
}: IntelligenceFeedProps) {
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Filter to high-confidence items first
  const sortedItems =
    items?.slice().sort((a, b) => b.confidence - a.confidence) ?? [];

  const hasItems = sortedItems.length > 0;

  return (
    <section
      aria-label="Intelligence Feed"
      className={cn(
        "rounded-2xl border border-border bg-card",
        "shadow-sm flex flex-col h-full",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Intelligence Feed
          </h2>
          {hasItems && (
            <span className="text-xs text-muted-foreground">
              ({sortedItems.length})
            </span>
          )}
        </div>

        {/* Manual refresh button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={loading}
          className="h-8 px-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/30 animate-pulse">
                <div className="h-3 w-12 bg-muted rounded mb-2" />
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : hasItems ? (
          <div className="space-y-2">
            {sortedItems.slice(0, 5).map((insight) => (
              <InsightItem key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <EmptyState lifecycle={lifecycle} reasonMessage={reasonMessage} />
        )}
      </div>

      {/* Footer with advisory disclaimer */}
      <div className="p-3 border-t border-border bg-muted/20">
        <p className="text-[10px] text-muted-foreground text-center">
          AI-generated insights are advisory only. Verify before acting.
        </p>
      </div>
    </section>
  );
}

export type { IntelligenceFeedProps };
