"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ArrowLeftRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  FileText,
  Lock,
  TrendingUp,
  BarChart3,
  Calculator,
  RefreshCw,
  Eye,
  ChevronDown,
} from "lucide-react";

// Pagination constants
const INITIAL_VARIANCE_COUNT = 20;
const LOAD_MORE_COUNT = 20;

type ReconciliationType = "labor" | "indirect" | "full";
type ReconciliationStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "approved"
  | "failed";
type VarianceStatus = "identified" | "under_review" | "resolved" | "escalated";

interface ReconciliationRun {
  id: string;
  run_type: ReconciliationType;
  fiscal_year: number;
  period: string;
  status: ReconciliationStatus;
  run_date: string;
  completed_at: string | null;
  total_items: number;
  variances_found: number;
  variances_resolved: number;
}

interface Variance {
  id: string;
  reconciliation_id: string;
  category: string;
  description: string;
  source_amount: number;
  target_amount: number;
  variance_amount: number;
  variance_percent: number;
  status: VarianceStatus;
  assigned_to: string | null;
  resolution_notes: string | null;
}

// Demo data
const DEMO_RUNS: ReconciliationRun[] = [
  {
    id: "rec-001",
    run_type: "labor",
    fiscal_year: 2024,
    period: "Q4 2024",
    status: "completed",
    run_date: "2024-01-15",
    completed_at: "2024-01-15",
    total_items: 450,
    variances_found: 12,
    variances_resolved: 10,
  },
  {
    id: "rec-002",
    run_type: "indirect",
    fiscal_year: 2024,
    period: "Q4 2024",
    status: "in_progress",
    run_date: "2024-01-16",
    completed_at: null,
    total_items: 85,
    variances_found: 5,
    variances_resolved: 2,
  },
  {
    id: "rec-003",
    run_type: "full",
    fiscal_year: 2024,
    period: "FY 2024",
    status: "pending",
    run_date: "2024-01-20",
    completed_at: null,
    total_items: 0,
    variances_found: 0,
    variances_resolved: 0,
  },
];

const DEMO_VARIANCES: Variance[] = [
  {
    id: "var-001",
    reconciliation_id: "rec-001",
    category: "Direct Labor",
    description: "Timesheet vs Payroll variance for Contract FA8750-24-C-0001",
    source_amount: 125000,
    target_amount: 124750,
    variance_amount: 250,
    variance_percent: 0.2,
    status: "resolved",
    assigned_to: "John Smith",
    resolution_notes: "Rounding adjustment applied, within tolerance",
  },
  {
    id: "var-002",
    reconciliation_id: "rec-001",
    category: "Fringe Benefits",
    description: "Fringe allocation variance for engineering pool",
    source_amount: 45000,
    target_amount: 44200,
    variance_amount: 800,
    variance_percent: 1.78,
    status: "under_review",
    assigned_to: "Jane Doe",
    resolution_notes: null,
  },
  {
    id: "var-003",
    reconciliation_id: "rec-002",
    category: "Overhead",
    description: "Overhead pool allocation vs GL posting",
    source_amount: 82000,
    target_amount: 83500,
    variance_amount: -1500,
    variance_percent: -1.83,
    status: "identified",
    assigned_to: null,
    resolution_notes: null,
  },
  {
    id: "var-004",
    reconciliation_id: "rec-002",
    category: "G&A",
    description: "G&A rate application variance",
    source_amount: 35000,
    target_amount: 35800,
    variance_amount: -800,
    variance_percent: -2.29,
    status: "escalated",
    assigned_to: "CFO Review",
    resolution_notes: "Requires DCAA coordination",
  },
];

const ICS_SCHEDULES = [
  { schedule: "H", name: "Contract Brief", status: "complete" },
  {
    schedule: "I",
    name: "Cumulative Allowable Cost Worksheet",
    status: "in_progress",
  },
  { schedule: "J", name: "Subcontract Information", status: "pending" },
  { schedule: "K", name: "Summary of Hours and Amounts", status: "complete" },
  {
    schedule: "L",
    name: "Reconciliation of Contract Briefs",
    status: "in_progress",
  },
  { schedule: "M", name: "Indirect Cost Pools", status: "complete" },
  { schedule: "N", name: "Certificate of Indirect Costs", status: "pending" },
  { schedule: "O", name: "Contract Closing", status: "pending" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getReconciliationStatusColor(status: ReconciliationStatus): string {
  switch (status) {
    case "pending":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    case "in_progress":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "completed":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "approved":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "failed":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getVarianceStatusColor(status: VarianceStatus): string {
  switch (status) {
    case "identified":
      return "bg-yellow-500/10 text-yellow-500";
    case "under_review":
      return "bg-blue-500/10 text-blue-500";
    case "resolved":
      return "bg-green-500/10 text-green-500";
    case "escalated":
      return "bg-red-500/10 text-red-500";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
}

function getScheduleStatusColor(status: string): string {
  switch (status) {
    case "complete":
      return "text-green-500";
    case "in_progress":
      return "text-blue-500";
    case "pending":
      return "text-gray-500";
    default:
      return "text-gray-500";
  }
}

export default function ReconciliationPage() {
  const [runs] = useState<ReconciliationRun[]>(DEMO_RUNS);
  const [variances] = useState<Variance[]>(DEMO_VARIANCES);
  const [selectedRun, setSelectedRun] = useState<ReconciliationRun | null>(
    null,
  );
  const [varianceDisplayCount, setVarianceDisplayCount] = useState(
    INITIAL_VARIANCE_COUNT,
  );

  // Memoize summary stats - these are computed once when data changes
  const { totalVariances, resolvedVariances, escalatedVariances } = useMemo(
    () => ({
      totalVariances: variances.length,
      resolvedVariances: variances.filter((v) => v.status === "resolved")
        .length,
      escalatedVariances: variances.filter((v) => v.status === "escalated")
        .length,
    }),
    [variances],
  );

  // Memoize filtered variances
  const allRunVariances = useMemo(() => {
    return selectedRun
      ? variances.filter((v) => v.reconciliation_id === selectedRun.id)
      : variances;
  }, [variances, selectedRun]);

  // Paginated variances for display
  const runVariances = useMemo(() => {
    return allRunVariances.slice(0, varianceDisplayCount);
  }, [allRunVariances, varianceDisplayCount]);

  const hasMoreVariances = varianceDisplayCount < allRunVariances.length;

  const loadMoreVariances = useCallback(() => {
    setVarianceDisplayCount((prev) =>
      Math.min(prev + LOAD_MORE_COUNT, allRunVariances.length),
    );
  }, [allRunVariances.length]);

  // Reset pagination when run selection changes
  const handleRunSelect = useCallback((run: ReconciliationRun | null) => {
    setSelectedRun(run);
    setVarianceDisplayCount(INITIAL_VARIANCE_COUNT);
  }, []);

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
            Reconciliation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            DCAA-compliant labor and indirect cost reconciliation with ICS
            preparation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
            <Download className="h-4 w-4" />
            Export ICS
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <RefreshCw className="h-4 w-4" />
            Run Reconciliation
          </button>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Lock className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-500">
            Incurred Cost Submission Requirements
          </p>
          <p className="text-sm text-muted-foreground">
            Reconciliation supports DCAA Incurred Cost Submission (ICS) per FAR
            52.216-7. All variances must be resolved with documented evidence
            before final submission.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="text-sm">Active Reconciliations</span>
          </div>
          <p className="mt-2 text-2xl font-semibold">
            {runs.filter((r) => r.status === "in_progress").length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Open Variances</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-yellow-500">
            {totalVariances - resolvedVariances}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Resolved</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-500">
            {resolvedVariances}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm">Escalated</span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-red-500">
            {escalatedVariances}
          </p>
        </div>
      </div>

      {/* Reconciliation Runs */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-medium">Reconciliation Runs</h2>
        </div>
        <div className="divide-y">
          {runs.map((run) => (
            <div
              key={run.id}
              className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedRun?.id === run.id ? "bg-primary/5" : ""
              }`}
              onClick={() =>
                handleRunSelect(selectedRun?.id === run.id ? null : run)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{run.period}</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${getReconciliationStatusColor(
                          run.status,
                        )}`}
                      >
                        {run.status.replace("_", " ")}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                        {run.run_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Run date: {run.run_date}
                      {run.completed_at && ` • Completed: ${run.completed_at}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="font-medium">{run.total_items}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Variances</p>
                    <p
                      className={`font-medium ${run.variances_found > 0 ? "text-yellow-500" : "text-green-500"}`}
                    >
                      {run.variances_found}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Resolved</p>
                    <p className="font-medium text-green-500">
                      {run.variances_resolved}
                    </p>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variances Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-medium">
              {selectedRun
                ? `Variances - ${selectedRun.period}`
                : "All Variances"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Variance analysis and resolution tracking
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Target
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Assigned To
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {runVariances.map((variance) => (
                <tr
                  key={variance.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{variance.category}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {variance.description}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(variance.source_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(variance.target_amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono ${
                        variance.variance_amount > 0
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {formatCurrency(variance.variance_amount)}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {variance.variance_percent > 0 ? "+" : ""}
                      {variance.variance_percent.toFixed(2)}%
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getVarianceStatusColor(variance.status)}`}
                    >
                      {variance.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {variance.assigned_to || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Load More Variances */}
        {hasMoreVariances && (
          <div className="p-4 border-t flex justify-center">
            <button
              onClick={loadMoreVariances}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm"
            >
              <ChevronDown className="h-4 w-4" />
              Load More ({allRunVariances.length - varianceDisplayCount}{" "}
              remaining)
            </button>
          </div>
        )}
      </div>

      {/* ICS Schedules */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-medium">Incurred Cost Submission Schedules</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            FAR 52.216-7 required schedules for cost-reimbursement contracts
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
          {ICS_SCHEDULES.map((schedule) => (
            <div key={schedule.schedule} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium">
                  Schedule {schedule.schedule}
                </span>
                <span
                  className={`text-xs ${getScheduleStatusColor(schedule.status)}`}
                >
                  {schedule.status === "complete" && (
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                  )}
                  {schedule.status === "in_progress" && (
                    <Clock className="h-4 w-4 inline mr-1" />
                  )}
                  {schedule.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {schedule.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SF-1408 Quick Link */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">SF-1408 Preaward Survey</p>
              <p className="text-sm text-muted-foreground">
                Accounting system adequacy checklist for government contracting
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
            <Eye className="h-4 w-4" />
            View Checklist
          </button>
        </div>
      </div>
    </main>
  );
}
