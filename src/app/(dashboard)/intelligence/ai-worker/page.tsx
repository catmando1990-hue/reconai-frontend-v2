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
import { useWorkerTasks } from "@/hooks/useWorkerTasks";
import {
  AI_DISCLAIMER,
  FORM_ASSISTANCE_DISCLAIMER,
} from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { severityFromConfidence } from "@/lib/scoring";
import { TierGate } from "@/components/legal/TierGate";
import { Bot, RefreshCw } from "lucide-react";

export default function AiWorkerPage() {
  const { data, isLoading, error, refetch } = useWorkerTasks();

  return (
    <TierGate tier="intelligence" title="AI Worker">
      <RouteShell
        title="AI Worker"
        subtitle="Structured assistance for repeatable finance workflows. You approve every final outcome."
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
          <DisclaimerNotice>{FORM_ASSISTANCE_DISCLAIMER}</DisclaimerNotice>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Primary Panel - Task Queue */}
          <div className="lg:col-span-8">
            <PrimaryPanel
              title="Task Queue"
              subtitle="AI-assisted workflow tasks awaiting your approval"
            >
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading tasks…</p>
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
                  {data.items.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{t.title}</h3>
                            <SeverityBadge
                              severity={severityFromConfidence(t.confidence)}
                            />
                            <StatusChip variant="muted">{t.status}</StatusChip>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t.summary}
                          </p>
                          <ConfidenceMeta confidence={t.confidence} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Bot}
                  title="No tasks queued"
                  description="As you connect data sources and enable workflows, tasks will appear here."
                />
              )}
            </PrimaryPanel>
          </div>

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title="Task Summary">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Tasks
                  </span>
                  <span className="text-lg font-semibold">
                    {data?.items?.length ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Queued</span>
                  <span className="text-lg font-semibold">
                    {data?.items?.filter((t) => t.status === "queued").length ??
                      0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Complete
                  </span>
                  <span className="text-lg font-semibold">
                    {data?.items?.filter((t) => t.status === "complete")
                      .length ?? 0}
                  </span>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="How AI Worker Works">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  AI Worker analyzes your data and prepares structured task
                  recommendations for common finance workflows.
                </p>
                <p>
                  Every task shows confidence scores and requires your explicit
                  approval before any action is taken.
                </p>
                <p>
                  High-confidence tasks (≥0.85) are ready for review. Lower
                  confidence tasks may need additional verification.
                </p>
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
                  href="/intelligence/alerts"
                  className="block text-primary hover:underline"
                >
                  View alerts
                </Link>
                <Link
                  href="/settings"
                  className="block text-primary hover:underline"
                >
                  Configure workflows
                </Link>
              </div>
            </SecondaryPanel>
          </div>
        </div>
      </RouteShell>
    </TierGate>
  );
}
