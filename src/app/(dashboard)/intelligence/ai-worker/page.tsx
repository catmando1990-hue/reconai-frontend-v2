"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { ConfidenceMeta } from "@/components/dashboard/ConfidenceMeta";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { useWorkerTasks } from "@/hooks/useWorkerTasks";
import {
  AI_DISCLAIMER,
  FORM_ASSISTANCE_DISCLAIMER,
} from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { severityFromConfidence } from "@/lib/scoring";
import { TierGate } from "@/components/legal/TierGate";

export default function AiWorkerPage() {
  const { data, isLoading, error, refetch } = useWorkerTasks();

  return (
    <TierGate tier="intelligence" title="AI Worker">
      <RouteShell
        title="AI Worker"
        subtitle="Structured assistance for repeatable finance workflows. You approve every final outcome."
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
          <DisclaimerNotice>{FORM_ASSISTANCE_DISCLAIMER}</DisclaimerNotice>
        </div>

        <div className="h-6" />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading tasks…</p>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm">{error}</p>
            <Button onClick={() => void refetch()}>Retry</Button>
          </div>
        ) : data?.items?.length ? (
          <div className="space-y-4">
            {data.items.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium">{t.title}</h2>
                    <SeverityBadge
                      severity={severityFromConfidence(t.confidence)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{t.summary}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <ConfidenceMeta confidence={t.confidence} />
                    <span className="text-xs text-muted-foreground">
                      Status: {t.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No tasks queued. As you connect data sources and enable workflows,
            tasks will appear here.
          </p>
        )}
      </RouteShell>
    </TierGate>
  );
}
