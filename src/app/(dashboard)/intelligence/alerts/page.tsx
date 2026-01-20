"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
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
import { Bell, RefreshCw } from "lucide-react";

export default function AlertsPage() {
  const { data, isLoading, error, refetch } = useAlerts();

  return (
    <TierGate tier="intelligence" title="Alerts">
      <RouteShell
        title="Alerts"
        subtitle="Signals that may require review or documentation. Always verify before acting."
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
          {/* Primary Panel - Alerts List */}
          <div className="lg:col-span-8">
            <PrimaryPanel
              title="Active Alerts"
              subtitle="Signals requiring review or documentation"
            >
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading alerts…</p>
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
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{item.title}</h3>
                            <SeverityBadge
                              severity={severityFromConfidence(item.confidence)}
                            />
                            <StatusChip variant="muted">
                              {item.status}
                            </StatusChip>
                            <StatusChip variant="muted">{item.kind}</StatusChip>
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
                  icon={Bell}
                  title="No alerts yet"
                  description="As transactions and rules accumulate, ReconAI will surface review items here."
                />
              )}
            </PrimaryPanel>
          </div>

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title="Alert Summary">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Alerts
                  </span>
                  <span className="text-lg font-semibold">
                    {data?.items?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New</span>
                  <span className="text-lg font-semibold">
                    {data?.items?.filter((a) => a.status === "new").length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Resolved
                  </span>
                  <span className="text-lg font-semibold">
                    {data?.items?.filter((a) => a.status === "resolved")
                      .length ?? 0}
                  </span>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Alert Types">
              <div className="space-y-3 text-sm">
                <div className="p-2 rounded bg-muted/50">
                  <p className="font-medium">Anomaly Detection</p>
                  <p className="text-xs text-muted-foreground">
                    Unusual patterns in transaction data
                  </p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="font-medium">Compliance Risk</p>
                  <p className="text-xs text-muted-foreground">
                    Potential regulatory or policy issues
                  </p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="font-medium">Data Quality</p>
                  <p className="text-xs text-muted-foreground">
                    Missing or inconsistent data fields
                  </p>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Quick Links" collapsible>
              <div className="space-y-2 text-sm">
                <Link
                  href="/intelligence/insights"
                  className="block text-primary hover:underline"
                >
                  View insights
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
