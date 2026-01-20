"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useCfoSnapshot } from "@/hooks/useCfoSnapshot";
import { TierGate } from "@/components/legal/TierGate";
import { AI_DISCLAIMER, REGULATORY_DISCLAIMER } from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { FileText, RefreshCw, AlertTriangle, ChevronRight } from "lucide-react";

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return `$${value.toLocaleString()}`;
}

function ExecutiveSummaryBody() {
  const { data, isLoading, error, refetch } = useCfoSnapshot();

  return (
    <RouteShell
      title="Executive Summary"
      subtitle="CFO-grade snapshot for decision-making: risks, actions, and runway posture"
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
        {/* Primary Panel - Executive Metrics */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Financial Posture"
            subtitle="Key metrics for executive decision-making"
          >
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading executive summary…
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
            ) : data?.snapshot ? (
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-background p-5">
                    <p className="text-sm text-muted-foreground">Runway</p>
                    <p className="mt-1 text-3xl font-semibold">
                      {data.snapshot.runway_days === null
                        ? "—"
                        : `${data.snapshot.runway_days} days`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-5">
                    <p className="text-sm text-muted-foreground">
                      Cash on Hand
                    </p>
                    <p className="mt-1 text-3xl font-semibold">
                      {formatCurrency(data.snapshot.cash_on_hand)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-5">
                    <p className="text-sm text-muted-foreground">
                      Monthly Burn
                    </p>
                    <p className="mt-1 text-3xl font-semibold">
                      {formatCurrency(data.snapshot.burn_rate_monthly)}
                    </p>
                  </div>
                </div>

                {/* Risks Section */}
                <div className="rounded-lg border border-border bg-background p-5">
                  <h3 className="text-sm font-semibold mb-3">Top Risks</h3>
                  {data.snapshot.top_risks.length ? (
                    <ul className="space-y-2">
                      {data.snapshot.top_risks.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {r.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No active risks detected.
                    </p>
                  )}
                </div>

                {/* Actions Section */}
                <div className="rounded-lg border border-border bg-background p-5">
                  <h3 className="text-sm font-semibold mb-3">Next Actions</h3>
                  {data.snapshot.next_actions.length ? (
                    <ul className="space-y-3">
                      {data.snapshot.next_actions.map((a) => (
                        <li key={a.id} className="space-y-1">
                          <p className="text-sm flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                            {a.title}
                          </p>
                          <p className="text-xs text-muted-foreground ml-6">
                            {a.rationale}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No recommended actions at this time.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No CFO snapshot available"
                description="Connect banks and complete onboarding to generate a baseline executive summary."
              />
            )}
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Summary Stats">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Risk Count
                </span>
                <span className="text-xl font-semibold">
                  {data?.snapshot?.top_risks.length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pending Actions
                </span>
                <span className="text-xl font-semibold">
                  {data?.snapshot?.next_actions.length ?? 0}
                </span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Report Usage">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                This executive summary is designed for board meetings, investor
                updates, and executive decision-making.
              </p>
              <p>
                All metrics are calculated from connected financial data sources
                and updated on refresh.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href="/cfo/compliance"
                className="block text-primary hover:underline"
              >
                View compliance
              </Link>
              <Link
                href="/cfo/overview"
                className="block text-primary hover:underline"
              >
                CFO overview
              </Link>
              <Link
                href="/financial-reports"
                className="block text-primary hover:underline"
              >
                Financial reports
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function CfoExecutiveSummaryPage() {
  return (
    <TierGate
      tier="cfo"
      title="Executive Summary"
      subtitle="Upgrade or request access to unlock CFO tools."
    >
      <ExecutiveSummaryBody />
    </TierGate>
  );
}
