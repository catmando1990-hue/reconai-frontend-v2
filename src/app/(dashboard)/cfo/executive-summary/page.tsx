"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { useCfoSnapshot } from "@/lib/hooks/useCfoSnapshot";
import { TierGate } from "@/components/legal/TierGate";
import { AI_DISCLAIMER, REGULATORY_DISCLAIMER } from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-md border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function ExecutiveSummaryBody() {
  const { data, isLoading, error, refetch } = useCfoSnapshot();

  return (
    <RouteShell
      title="Executive Summary"
      subtitle="CFO-grade snapshot for decision-making: risks, actions, and runway posture."
      right={
        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-2">
        <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>
        <DisclaimerNotice>{REGULATORY_DISCLAIMER}</DisclaimerNotice>
      </div>

      <div className="h-6" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Loading executive summary…
        </p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm">{error}</p>
          <Button onClick={() => void refetch()}>Retry</Button>
        </div>
      ) : data?.snapshot ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              label="Runway (days)"
              value={
                data.snapshot.runway_days === null
                  ? "—"
                  : String(data.snapshot.runway_days)
              }
            />
            <Metric
              label="Cash on hand"
              value={
                data.snapshot.cash_on_hand === null
                  ? "—"
                  : `$${data.snapshot.cash_on_hand.toLocaleString()}`
              }
            />
            <Metric
              label="Burn rate (monthly)"
              value={
                data.snapshot.burn_rate_monthly === null
                  ? "—"
                  : `$${data.snapshot.burn_rate_monthly.toLocaleString()}`
              }
            />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Top risks</h2>
            {data.snapshot.top_risks.length ? (
              <ul className="space-y-2">
                {data.snapshot.top_risks.map((r) => (
                  <li key={r.id} className="text-sm text-muted-foreground">
                    • {r.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active risks detected.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Next actions</h2>
            {data.snapshot.next_actions.length ? (
              <ul className="space-y-3">
                {data.snapshot.next_actions.map((a) => (
                  <li key={a.id} className="space-y-1">
                    <p className="text-sm">• {a.title}</p>
                    <p className="text-xs text-muted-foreground">
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
        <p className="text-sm text-muted-foreground">
          No CFO snapshot yet. Connect banks and complete onboarding to generate
          a baseline.
        </p>
      )}
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
