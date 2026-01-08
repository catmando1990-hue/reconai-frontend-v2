"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { useCfoSnapshot } from "@/lib/hooks/useCfoSnapshot";
import { useOrg } from "@/lib/org-context";
import { hasAccess } from "@/lib/access";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-md border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function CfoExecutiveSummaryPage() {
  const { role } = useOrg();
  const allowed = hasAccess(role, "cfo");

  const { data, isLoading, error, refetch } = useCfoSnapshot();

  return (
    <RouteShell
      title="Executive Summary"
      subtitle="CFO-grade snapshot for decision-making: risks, actions, and runway posture."
      right={
        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={isLoading || !allowed}
        >
          Refresh
        </Button>
      }
    >
      {!allowed ? (
        <div className="space-y-2">
          <p className="text-sm">
            This page is part of the CFO tier. Request access or upgrade your
            plan to unlock CFO tools.
          </p>
          <p className="text-sm text-muted-foreground">
            Role detected: {role ?? "unknown"}.
          </p>
        </div>
      ) : isLoading ? (
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
