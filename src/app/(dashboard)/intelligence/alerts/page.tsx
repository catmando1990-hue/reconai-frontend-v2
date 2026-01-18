"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { ConfidenceMeta } from "@/components/dashboard/ConfidenceMeta";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { useAlerts } from "@/hooks/useAlerts";
import { AI_DISCLAIMER, REGULATORY_DISCLAIMER } from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { severityFromConfidence } from "@/lib/scoring";
import { TierGate } from "@/components/legal/TierGate";

export default function AlertsPage() {
  const { data, isLoading, error, refetch } = useAlerts();

  return (
    <TierGate tier="intelligence" title="Alerts">
      <RouteShell
        title="Alerts"
        subtitle="Signals that may require review or documentation. Always verify before acting."
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
          <p className="text-sm text-muted-foreground">Loading alerts…</p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm">{error}</p>
            <Button onClick={() => void refetch()}>Retry</Button>
          </div>
        ) : data?.items?.length ? (
          <div className="space-y-4">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium">{item.title}</h2>
                    <SeverityBadge
                      severity={severityFromConfidence(item.confidence)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <ConfidenceMeta confidence={item.confidence} />
                    <span className="text-xs text-muted-foreground">
                      Status: {item.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Kind: {item.kind}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No alerts yet. As transactions and rules accumulate, ReconAI will
            surface review items here.
          </p>
        )}
      </RouteShell>
    </TierGate>
  );
}
