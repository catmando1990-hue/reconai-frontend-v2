"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { ConfidenceMeta } from "@/components/dashboard/ConfidenceMeta";
import { useInsightsSummary } from "@/lib/hooks/useInsightsSummary";
import { AI_DISCLAIMER } from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { severityFromConfidence } from "@/lib/scoring";
import { TierGate } from "@/components/legal/TierGate";
import { IntelligenceV1Panel } from "@/components/intelligence/IntelligenceV1Panel";

export default function IntelligenceInsightsPage() {
  const { data, isLoading, error, refetch } = useInsightsSummary();

  return (
    <TierGate tier="intelligence" title="Insights">
      <RouteShell
        title="Insights"
        subtitle="Decision-grade signals surfaced from transaction behavior and operating patterns."
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
        <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>

        <div className="h-6" />

        {/* Existing insights summary surface */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading insights…</p>
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
                  <ConfidenceMeta confidence={item.confidence} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No insights yet. Connect a bank and upload transactions to generate
            signals.
          </p>
        )}

        <div className="h-8" />

        {/* BUILD 20 — Opt-in Intelligence v1 surfacing (no auto-run) */}
        <IntelligenceV1Panel />
      </RouteShell>
    </TierGate>
  );
}
