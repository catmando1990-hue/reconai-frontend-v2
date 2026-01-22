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
import { Bell, RefreshCw, FlaskConical } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { STATUS } from "@/lib/dashboardCopy";

export default function AlertsPage() {
  const { data, isLoading, error, refetch } = useAlerts();

  // P0 FIX: Check for demo mode flag from fetcher
  const isDemo = (data as { _isDemo?: boolean })?._isDemo ?? false;
  const demoDisclaimer = (data as { _demoDisclaimer?: string })
    ?._demoDisclaimer;

  // P0 FIX: Helper to format counts - show "—" for null/undefined, not 0
  const formatCount = (count: number | null | undefined): string => {
    if (count === null || count === undefined) return STATUS.NO_DATA;
    return String(count);
  };

  return (
    <TierGate tier="intelligence" title="Alerts">
      <RouteShell
        title="Alerts"
        subtitle="Signals that may require review or documentation. Always verify before acting."
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
        <div className="space-y-2">
          <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>
          <DisclaimerNotice>{REGULATORY_DISCLAIMER}</DisclaimerNotice>
        </div>

        {/* P0 FIX: Show demo disclaimer when in demo mode */}
        {isDemo && demoDisclaimer && (
          <div className="mt-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs text-purple-600 dark:text-purple-400">
            {demoDisclaimer}
          </div>
        )}

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
                  {/* P0 FIX: Show "No data" instead of 0 when data unavailable */}
                  <span className="text-lg font-semibold">
                    {formatCount(data?.items?.length)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New</span>
                  {/* P0 FIX: Show "No data" instead of 0 when data unavailable */}
                  <span className="text-lg font-semibold">
                    {data?.items
                      ? formatCount(
                          data.items.filter((a) => a.status === "new").length,
                        )
                      : STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Resolved
                  </span>
                  {/* P0 FIX: Show "No data" instead of 0 when data unavailable */}
                  <span className="text-lg font-semibold">
                    {data?.items
                      ? formatCount(
                          data.items.filter((a) => a.status === "resolved")
                            .length,
                        )
                      : STATUS.NO_DATA}
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
                  href={ROUTES.INTELLIGENCE_INSIGHTS}
                  className="block text-primary hover:underline"
                >
                  View insights
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
