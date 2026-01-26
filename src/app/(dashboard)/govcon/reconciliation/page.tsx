"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Download,
  FileText,
  RefreshCw,
  Loader2,
  X,
  CheckCircle,
  AlertTriangle,
  LogIn,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Button } from "@/components/ui/button";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { ROUTES } from "@/lib/routes";
import { auditedFetch, HttpError } from "@/lib/auditedFetch";

interface ReconciliationRun {
  id: string;
  run_type: string;
  fiscal_year: number;
  period_start: string | null;
  period_end: string | null;
  status: string;
  summary: string | null;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface Variance {
  id: string;
  run_id: string;
  variance_type: string;
  description: string;
  amount: number | null;
  status: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

const ICS_SCHEDULES = [
  { schedule: "H", name: "Contract Brief" },
  { schedule: "I", name: "Cumulative Allowable Cost Worksheet" },
  { schedule: "J", name: "Subcontract Information" },
  { schedule: "K", name: "Summary of Hours and Amounts" },
  { schedule: "L", name: "Reconciliation of Contract Briefs" },
  { schedule: "M", name: "Indirect Cost Pools" },
  { schedule: "N", name: "Certificate of Indirect Costs" },
  { schedule: "O", name: "Contract Closing" },
];

const RUN_TYPES = [
  { value: "labor", label: "Labor Reconciliation" },
  { value: "indirect", label: "Indirect Cost Reconciliation" },
  { value: "full", label: "Full ICS Reconciliation" },
];

export default function ReconciliationPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [variances, setVariances] = useState<Variance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [runType, setRunType] = useState("full");
  const [fiscalYear, setFiscalYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsAuthError(false);
    try {
      const data = await auditedFetch<{
        runs: ReconciliationRun[];
        variances: Variance[];
      }>("/api/govcon/reconciliation", { skipBodyValidation: true });
      setRuns(data.runs || []);
      setVariances(data.variances || []);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 401) {
          // P1 FIX: Track auth errors to show sign-in button
          setIsAuthError(true);
          setError("Not authenticated. Please sign in.");
        } else {
          setError(`Failed to load data: ${err.status}`);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate variance summary
  const varianceSummary = useMemo(() => {
    const open = variances.filter((v) => v.status === "open").length;
    const resolved = variances.filter((v) => v.status === "resolved").length;
    const escalated = variances.filter((v) => v.status === "escalated").length;
    return { open, resolved, escalated };
  }, [variances]);

  // Open new run modal
  const handleNewRun = () => {
    setRunType("full");
    setFiscalYear(new Date().getFullYear().toString());
    setNotes("");
    setFormError(null);
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setFormError(null);
  };

  // Start reconciliation run
  const handleStartRun = async () => {
    setSubmitting(true);
    setFormError(null);

    try {
      await auditedFetch("/api/govcon/reconciliation", {
        method: "POST",
        body: JSON.stringify({
          run_type: runType,
          fiscal_year: parseInt(fiscalYear) || new Date().getFullYear(),
          notes: notes || null,
        }),
        skipBodyValidation: true,
      });

      handleCloseModal();
      await fetchData();
    } catch (err) {
      if (err instanceof HttpError) {
        const body = err.body as { error?: string } | undefined;
        setFormError(body?.error || `Error: ${err.status}`);
      } else {
        setFormError(
          err instanceof Error ? err.message : "Failed to start run",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Export ICS
  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const response = await auditedFetch<Response>(
        "/api/govcon/reconciliation/export",
        {
          method: "POST",
          body: JSON.stringify({
            fiscal_year: parseInt(fiscalYear) || new Date().getFullYear(),
          }),
          rawResponse: true,
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ICS_FY${fiscalYear}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // P2 FIX: Show user-visible error for non-ok response
        setExportError(`Export failed: ${response.status}`);
      }
    } catch (err) {
      // P2 FIX: Show user-visible error instead of silent console.error
      if (err instanceof HttpError) {
        const body = err.body as { error?: string } | undefined;
        setExportError(body?.error || `Export failed: ${err.status}`);
      } else {
        setExportError(
          err instanceof Error ? err.message : "Failed to export ICS",
        );
      }
    } finally {
      setExporting(false);
    }
  };

  // Get run status variant
  const getRunStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "ok";
      case "running":
        return "muted";
      case "failed":
        return "warn";
      default:
        return "muted";
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <RouteShell
      title="Reconciliation"
      subtitle="DCAA-compliant labor and indirect cost reconciliation with ICS preparation"
      right={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export ICS
          </Button>
          <Button size="sm" onClick={handleNewRun}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Reconciliation
          </Button>
        </div>
      }
    >
      <PolicyBanner
        policy="accounting"
        message="Reconciliation supports DCAA Incurred Cost Submission (ICS) per FAR 52.216-7. All variances must be resolved with documented evidence before final submission."
        context="govcon"
      />

      {/* P2 FIX: Show export error with retry ability */}
      {exportError && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-destructive">{exportError}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="ml-4"
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Retry Export
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Reconciliation Runs</h2>
                <p className="text-sm text-muted-foreground">
                  {runs.length} run{runs.length !== 1 ? "s" : ""} completed
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleNewRun}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                New Run
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-destructive">{error}</p>
                  {isAuthError && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/sign-in")}
                      className="ml-4"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!loading && !error && runs.length === 0 && (
              <EmptyState
                icon={ArrowLeftRight}
                title="No reconciliation runs"
                description="Start your first reconciliation to compare labor and indirect costs."
              />
            )}

            {!loading && !error && runs.length > 0 && (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-lg border border-border/70 bg-muted/30 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {run.status === "completed" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : run.status === "failed" ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          <span className="font-medium">
                            {run.run_type === "full"
                              ? "Full ICS"
                              : run.run_type === "labor"
                                ? "Labor"
                                : "Indirect"}{" "}
                            Reconciliation
                          </span>
                          <StatusChip variant={getRunStatusVariant(run.status)}>
                            {run.status.toUpperCase()}
                          </StatusChip>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          FY {run.fiscal_year} • Started{" "}
                          {formatDate(run.started_at)}
                        </div>
                        {run.summary && (
                          <p className="text-sm text-muted-foreground">
                            {run.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variances Panel */}
          <div className="mt-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Variances</h2>
                <p className="text-sm text-muted-foreground">
                  Variance analysis and resolution tracking
                </p>
              </div>

              {!loading && variances.length === 0 && (
                <EmptyState
                  icon={FileText}
                  title="No variances"
                  description="Variances will appear here after a reconciliation run identifies discrepancies."
                />
              )}

              {!loading && variances.length > 0 && (
                <div className="space-y-2">
                  {variances.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3 rounded bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{v.variance_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.description}
                        </p>
                      </div>
                      <StatusChip
                        variant={
                          v.status === "resolved"
                            ? "ok"
                            : v.status === "escalated"
                              ? "warn"
                              : "muted"
                        }
                      >
                        {v.status.toUpperCase()}
                      </StatusChip>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Variance Summary">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active Runs
                </span>
                <span className="text-base font-medium">
                  {runs.filter((r) => r.status === "running").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Open Variances
                </span>
                <span className="text-base font-medium">
                  {varianceSummary.open}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolved</span>
                <span className="text-base font-medium text-green-600">
                  {varianceSummary.resolved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Escalated</span>
                <span className="text-base font-medium text-amber-600">
                  {varianceSummary.escalated}
                </span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  SF-1408 § cost-1 through cost-5 (Direct / Indirect Costs)
                </p>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="ICS Schedules">
            <div className="space-y-2">
              {ICS_SCHEDULES.map((schedule) => (
                <div
                  key={schedule.schedule}
                  className="flex items-center justify-between p-2 rounded bg-muted"
                >
                  <div>
                    <span className="font-mono text-xs font-medium">
                      Schedule {schedule.schedule}
                    </span>
                    <p className="text-xs text-muted-foreground truncate max-w-40">
                      {schedule.name}
                    </p>
                  </div>
                  <StatusChip
                    variant={
                      runs.some((r) => r.status === "completed")
                        ? "ok"
                        : "muted"
                    }
                  >
                    {runs.some((r) => r.status === "completed")
                      ? "Ready"
                      : "Pending"}
                  </StatusChip>
                </div>
              ))}
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="SF-1408 Preaward">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">SF-1408 Checklist</p>
                <p className="text-xs text-muted-foreground">
                  Accounting system adequacy for government contracting
                </p>
                <Link
                  href={ROUTES.GOVCON_SF1408}
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  View checklist →
                </Link>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.GOVCON_INDIRECTS}
                className="block text-primary hover:underline"
              >
                Indirect cost pools
              </Link>
              <Link
                href={ROUTES.GOVCON_TIMEKEEPING}
                className="block text-primary hover:underline"
              >
                Timekeeping
              </Link>
              <Link
                href={ROUTES.GOVCON_AUDIT}
                className="block text-primary hover:underline"
              >
                View audit trail
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>

      {/* New Run Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-base font-semibold">Start Reconciliation</h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Reconciliation Type
                </label>
                <select
                  value={runType}
                  onChange={(e) => setRunType(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                >
                  {RUN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Fiscal Year
                </label>
                <input
                  type="number"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  min="2000"
                  max="2100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Any notes for this run..."
                />
              </div>

              {formError && (
                <p className="text-xs text-destructive">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartRun}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "Start Reconciliation"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RouteShell>
  );
}
