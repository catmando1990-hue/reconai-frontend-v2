"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import {
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Lock,
  Calendar,
  Users,
} from "lucide-react";
import { usePayRuns } from "@/hooks/usePayroll";
import type { PayRun, PayRunStatus } from "@/lib/api/payroll-types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusBadge(status: PayRunStatus) {
  switch (status) {
    case "draft":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
          <FileText className="h-3 w-3" />
          Draft
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </span>
      );
    case "locked":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
          <Lock className="h-3 w-3" />
          Locked
        </span>
      );
    default:
      return null;
  }
}

function PayrollPayRunsBody() {
  const { data, isLoading, isError } = usePayRuns(50);

  const payRuns: PayRun[] = data?.items ?? [];

  const statusCounts = {
    draft: payRuns.filter((r) => r.status === "draft").length,
    approved: payRuns.filter((r) => r.status === "approved").length,
    locked: payRuns.filter((r) => r.status === "locked").length,
  };

  const lastLocked = payRuns.find((r) => r.status === "locked");

  if (isLoading) {
    return (
      <RouteShell title="Pay Runs" subtitle="Payroll processing cycles">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </RouteShell>
    );
  }

  if (isError) {
    return (
      <RouteShell title="Pay Runs" subtitle="Payroll processing cycles">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-lg font-semibold">Failed to load pay runs</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please try refreshing the page.
          </p>
        </div>
      </RouteShell>
    );
  }

  return (
    <RouteShell title="Pay Runs" subtitle="Payroll processing cycles">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Pay Run History"
            subtitle={`${payRuns.length} pay runs`}
          >
            {payRuns.length === 0 ? (
              <EmptyState
                icon={Play}
                title="No pay runs recorded"
                description="Payroll processing cycles will appear here once pay runs are initiated and completed."
              />
            ) : (
              <div className="divide-y">
                {payRuns.map((run) => (
                  <div key={run.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {formatDate(run.pay_period_start)} –{" "}
                            {formatDate(run.pay_period_end)}
                          </span>
                          {getStatusBadge(run.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {run.description || "Pay run"}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {run.line_count} employees
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created {formatDate(run.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">
                          {formatCurrency(run.total_net)}
                        </p>
                        <p className="text-xs text-muted-foreground">net pay</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 rounded-lg bg-muted/50 p-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Gross</p>
                        <p className="font-medium">
                          {formatCurrency(run.total_gross)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Taxes</p>
                        <p className="font-medium text-red-600">
                          -{formatCurrency(run.total_tax)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Benefits</p>
                        <p className="font-medium text-amber-600">
                          -{formatCurrency(run.total_benefits)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deductions</p>
                        <p className="font-medium text-gray-600">
                          -{formatCurrency(run.total_deductions)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PrimaryPanel>
        </div>
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Pay Run Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Draft Runs
                </span>
                <span className="text-sm font-medium text-amber-600">
                  {statusCounts.draft}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="text-sm font-medium text-blue-600">
                  {statusCounts.approved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Locked</span>
                <span className="text-sm font-medium text-green-600">
                  {statusCounts.locked}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Runs
                </span>
                <span className="text-sm font-medium">{data?.total ?? 0}</span>
              </div>
            </div>
          </SecondaryPanel>

          {lastLocked && (
            <SecondaryPanel title="Last Completed">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Period</span>
                  <span className="text-xs font-medium">
                    {formatDate(lastLocked.pay_period_start)} –{" "}
                    {formatDate(lastLocked.pay_period_end)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Net Pay</span>
                  <span className="text-xs font-medium text-green-600">
                    {formatCurrency(lastLocked.total_net)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Locked</span>
                  <span className="text-xs font-medium">
                    {lastLocked.locked_at
                      ? formatDate(lastLocked.locked_at)
                      : "—"}
                  </span>
                </div>
              </div>
            </SecondaryPanel>
          )}

          <SecondaryPanel title="Quick Actions">
            <div className="space-y-2">
              <button
                type="button"
                className="w-full flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              >
                <Play className="h-4 w-4 text-muted-foreground" />
                Start New Pay Run
              </button>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollPayRunsPage() {
  return (
    <TierGate
      tier="payroll"
      title="Pay Runs"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollPayRunsBody />
    </TierGate>
  );
}
