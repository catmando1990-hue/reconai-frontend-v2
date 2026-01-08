"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { useInsightsSummary } from "@/lib/hooks/useInsightsSummary";

export default function InsightsPage() {
  const { data, isLoading, error, refetch } = useInsightsSummary();

  return (
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
                  <SeverityBadge severity={item.severity} />
                </div>
                <p className="text-sm text-muted-foreground">{item.summary}</p>
                <p className="text-xs text-muted-foreground">
                  Confidence: {(item.confidence * 100).toFixed(0)}% • Source:{" "}
                  {item.source}
                </p>
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
    </RouteShell>
  );
}
