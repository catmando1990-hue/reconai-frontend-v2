"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TierGate } from "@/components/legal/TierGate";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import { usePayrollOverview, usePayRuns } from "@/hooks/usePayroll";
import type { PayRun } from "@/lib/api/payroll-types";

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

function getStatusBadge(status: PayRun["status"]) {
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
          <CheckCircle2 className="h-3 w-3" />
          Locked
        </span>
      );
    default:
      return null;
  }
}

function PayrollOverviewBody() {
  const { data: overview, isLoading, isError } = usePayrollOverview();
  const { data: payRunsData } = usePayRuns(5);

  if (isLoading) {
    return (
      <RouteShell
        title="Payroll Overview"
        subtitle="Payroll status and key metrics"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </RouteShell>
    );
  }

  if (isError) {
    return (
      <RouteShell
        title="Payroll Overview"
        subtitle="Payroll status and key metrics"
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-lg font-semibold">Failed to load payroll data</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please try refreshing the page or contact support if the issue
            persists.
          </p>
        </div>
      </RouteShell>
    );
  }

  const hasData =
    overview.totalEmployees > 0 || overview.recentPayRuns.length > 0;

  return (
    <RouteShell
      title="Payroll Overview"
      subtitle="Payroll status and key metrics"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Active Employees
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {overview.activeEmployees}
              </p>
              <p className="text-xs text-muted-foreground">
                of {overview.totalEmployees} total
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-green-500/10 p-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Last Pay Run
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {overview.lastPayRun
                  ? formatCurrency(overview.lastPayRun.total_net)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {overview.lastPayRun
                  ? `Net pay · ${formatDate(overview.lastPayRun.pay_period_end)}`
                  : "No pay runs yet"}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-amber-500/10 p-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Pending Time
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {overview.pendingTimeEntries}
              </p>
              <p className="text-xs text-muted-foreground">
                entries awaiting approval
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-blue-500/10 p-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-muted-foreground">Pay Runs</span>
              </div>
              <p className="mt-3 text-2xl font-semibold">
                {payRunsData?.total ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">total processed</p>
            </div>
          </div>

          {/* Recent Pay Runs */}
          <PrimaryPanel
            title="Recent Pay Runs"
            subtitle="Latest payroll processing activity"
          >
            {overview.recentPayRuns.length === 0 ? (
              <EmptyState
                icon={LayoutDashboard}
                title="No pay runs yet"
                description="Create your first pay run to start processing payroll."
              />
            ) : (
              <div className="divide-y">
                {overview.recentPayRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {formatDate(run.pay_period_start)} –{" "}
                          {formatDate(run.pay_period_end)}
                        </span>
                        {getStatusBadge(run.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {run.line_count} employees ·{" "}
                        {run.description || "Pay run"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatCurrency(run.total_net)}
                      </p>
                      <p className="text-xs text-muted-foreground">net pay</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PrimaryPanel>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Key Figures">
            {!hasData ? (
              <p className="text-sm text-muted-foreground italic">
                No data available yet
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Headcount
                  </span>
                  <span className="text-sm font-medium">
                    {overview.totalEmployees}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Gross Pay
                  </span>
                  <span className="text-sm font-medium">
                    {overview.lastPayRun
                      ? formatCurrency(overview.lastPayRun.total_gross)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Taxes
                  </span>
                  <span className="text-sm font-medium">
                    {overview.lastPayRun
                      ? formatCurrency(overview.lastPayRun.total_tax)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Benefits
                  </span>
                  <span className="text-sm font-medium">
                    {overview.lastPayRun
                      ? formatCurrency(overview.lastPayRun.total_benefits)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Net Pay
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {overview.lastPayRun
                      ? formatCurrency(overview.lastPayRun.total_net)
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </SecondaryPanel>

          {overview.lastPayRun && (
            <SecondaryPanel title="Last Pay Period">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Period</span>
                  <span className="text-xs font-medium">
                    {formatDate(overview.lastPayRun.pay_period_start)} –{" "}
                    {formatDate(overview.lastPayRun.pay_period_end)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  {getStatusBadge(overview.lastPayRun.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Employees
                  </span>
                  <span className="text-xs font-medium">
                    {overview.lastPayRun.line_count}
                  </span>
                </div>
              </div>
            </SecondaryPanel>
          )}
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollOverviewPage() {
  return (
    <TierGate
      tier="payroll"
      title="Payroll Overview"
      subtitle="Upgrade or request access to unlock Payroll."
    >
      <PayrollOverviewBody />
    </TierGate>
  );
}
