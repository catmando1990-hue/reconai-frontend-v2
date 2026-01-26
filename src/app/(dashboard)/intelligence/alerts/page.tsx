"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfidenceMeta } from "@/components/dashboard/ConfidenceMeta";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { useAlerts } from "@/hooks/useAlerts";
import { AI_DISCLAIMER, REGULATORY_DISCLAIMER } from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { severityFromConfidence } from "@/lib/scoring";
import { TierGate } from "@/components/legal/TierGate";
import { Bell, RefreshCw, Check, Eye, X } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { STATUS } from "@/lib/dashboardCopy";

interface AlertItem {
  id: string;
  title: string;
  summary: string;
  kind: string;
  status: string;
  confidence: number;
  transaction_ids?: string[];
  created_at?: string;
}

export default function AlertsPage() {
  const { data, isLoading, error, refetch } = useAlerts();

  // Track resolved and reviewed alerts locally (no persistence yet)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const handleResolve = (alertId: string) => {
    setResolvedIds((prev) => new Set(prev).add(alertId));
  };

  const handleMarkReviewed = (alertId: string) => {
    setReviewedIds((prev) => new Set(prev).add(alertId));
  };

  const handleDismiss = (alertId: string) => {
    setResolvedIds((prev) => new Set(prev).add(alertId));
  };

  // Filter and categorize alerts
  const allItems = (data?.items as AlertItem[] | null) ?? [];
  const activeItems = allItems.filter((item) => !resolvedIds.has(item.id));
  const newCount = activeItems.filter(
    (a) => a.status === "new" && !reviewedIds.has(a.id),
  ).length;
  const resolvedCount = resolvedIds.size;

  const formatCount = (count: number | null | undefined): string => {
    if (count === null || count === undefined) return STATUS.NO_DATA;
    return String(count);
  };

  return (
    <TierGate tier="intelligence" title="Alerts">
      <RouteShell
        title="Alerts"
        subtitle="Claude-powered signals requiring review or action"
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
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Active Alerts</h2>
                <p className="text-sm text-muted-foreground">
                  Signals requiring review or documentation
                </p>
              </div>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Analyzing transactions…
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
              ) : activeItems.length ? (
                <div className="space-y-4">
                  {activeItems.map((item) => {
                    const isReviewed = reviewedIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border border-border bg-muted p-4 ${isReviewed ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{item.title}</h3>
                              <SeverityBadge
                                severity={severityFromConfidence(
                                  item.confidence,
                                )}
                              />
                              <StatusChip variant={isReviewed ? "ok" : "muted"}>
                                {isReviewed ? "reviewed" : item.status}
                              </StatusChip>
                              <StatusChip variant="muted">
                                {item.kind}
                              </StatusChip>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.summary}
                            </p>

                            {/* Show affected transactions */}
                            {item.transaction_ids &&
                              item.transaction_ids.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {item.transaction_ids.length} transaction
                                  {item.transaction_ids.length > 1
                                    ? "s"
                                    : ""}{" "}
                                  affected
                                </p>
                              )}

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <ConfidenceMeta confidence={item.confidence} />
                              <span className="text-muted-foreground/60">
                                •
                              </span>
                              <span>
                                {item.created_at
                                  ? new Date(item.created_at).toLocaleString()
                                  : "Time unknown"}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {!isReviewed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkReviewed(item.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolve(item.id)}
                              className="text-primary border-primary hover:bg-primary/10"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDismiss(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Bell}
                  title="No alerts"
                  description="Your transactions look good. No issues detected."
                />
              )}
            </div>
          </div>

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title="Alert Summary">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Alerts
                  </span>
                  <span className="text-lg font-medium">
                    {formatCount(activeItems.length)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New</span>
                  <span className="text-lg font-medium">
                    {formatCount(newCount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Resolved
                  </span>
                  <span className="text-lg font-medium">
                    {formatCount(resolvedCount)}
                  </span>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Alert Types">
              <div className="space-y-3 text-sm">
                <div className="p-2 rounded border border-border bg-muted">
                  <p className="font-medium">Duplicate Detection</p>
                  <p className="text-xs text-muted-foreground">
                    Same amount and merchant within 48 hours
                  </p>
                </div>
                <div className="p-2 rounded border border-border bg-muted">
                  <p className="font-medium">Compliance Risk</p>
                  <p className="text-xs text-muted-foreground">
                    Large transactions, missing documentation
                  </p>
                </div>
                <div className="p-2 rounded border border-border bg-muted">
                  <p className="font-medium">Anomaly</p>
                  <p className="text-xs text-muted-foreground">
                    Unusual patterns vs typical spending
                  </p>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Quick Links" collapsible>
              <div className="space-y-2 text-sm">
                <Link
                  href={ROUTES.INTELLIGENCE_INSIGHTS}
                  className="block text-primary hover:underline"
                >
                  View insights
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
