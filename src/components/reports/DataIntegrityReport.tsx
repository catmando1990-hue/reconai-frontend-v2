"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import {
  Download,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Link2,
} from "lucide-react";

type IntegrityStatus = "verified" | "warning" | "error";

type DataSource = {
  id: string;
  name: string;
  type: "plaid" | "upload" | "manual";
  status: IntegrityStatus;
  last_sync: string | null;
  record_count: number;
  coverage_start: string | null;
  coverage_end: string | null;
  issues: string[];
};

type IntegritySummary = {
  total_sources: number;
  verified_count: number;
  warning_count: number;
  error_count: number;
  total_records: number;
  overall_status: IntegrityStatus;
  last_check: string;
};

type DataIntegrityResponse = {
  sources: DataSource[];
  summary: IntegritySummary;
  request_id: string;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DataIntegrityReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [sources, setSources] = useState<DataSource[]>([]);
  const [summary, setSummary] = useState<IntegritySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<DataIntegrityResponse>(
        "/api/reports/data-integrity",
      );
      setSources(data.sources || []);
      setSummary(data.summary || null);
    } catch (e) {
      // Surface request_id on errors
      const requestId = crypto.randomUUID();
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(`${msg} (request_id: ${requestId})`);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchData();
  }, [isLoaded, fetchData]);

  const handleExportCSV = () => {
    if (sources.length === 0) return;

    const headers = [
      "Source",
      "Type",
      "Status",
      "Last Sync",
      "Records",
      "Coverage Start",
      "Coverage End",
      "Issues",
    ];
    const rows = sources.map((s) => [
      `"${s.name}"`,
      s.type,
      s.status,
      s.last_sync || "",
      s.record_count.toString(),
      s.coverage_start || "",
      s.coverage_end || "",
      `"${s.issues.join("; ")}"`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data-integrity-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusIcon = (status: IntegrityStatus) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const statusLabel = (status: IntegrityStatus) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "warning":
        return "Warning";
      case "error":
        return "Error";
    }
  };

  const sourceTypeIcon = (type: DataSource["type"]) => {
    switch (type) {
      case "plaid":
        return <Link2 className="h-4 w-4" />;
      case "upload":
        return <Database className="h-4 w-4" />;
      case "manual":
        return <Shield className="h-4 w-4" />;
    }
  };

  const sourceTypeLabel = (type: DataSource["type"]) => {
    switch (type) {
      case "plaid":
        return "Plaid Connection";
      case "upload":
        return "File Upload";
      case "manual":
        return "Manual Entry";
    }
  };

  const overallStatusColor = (status: IntegrityStatus) => {
    switch (status) {
      case "verified":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
      case "warning":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "error":
        return "bg-red-500/10 text-red-600 border-red-500/30";
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Data Integrity Report</h3>
          <p className="text-xs text-muted-foreground">
            Source lineage and trust verification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Run Check
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={sources.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="px-4 py-8 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && sources.length === 0 && (
        <div className="px-4 py-12 text-center">
          <Database className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No data sources connected.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Connect bank accounts or upload statements to see data integrity
            status.
          </p>
        </div>
      )}

      {!loading && !error && sources.length > 0 && summary && (
        <>
          {/* Overall Status Banner */}
          <div
            className={`mx-4 mt-4 rounded-lg border p-4 ${overallStatusColor(
              summary.overall_status,
            )}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcon(summary.overall_status)}
                <div>
                  <div className="font-semibold">
                    Overall Status: {statusLabel(summary.overall_status)}
                  </div>
                  <div className="text-xs opacity-80">
                    Last checked: {formatDateTime(summary.last_check)}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm">
                <div>
                  {summary.total_records.toLocaleString()} total records
                </div>
                <div className="text-xs opacity-80">
                  across {summary.total_sources} sources
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 border-b px-4 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-lg font-semibold text-emerald-600">
                  {summary.verified_count}
                </div>
                <div className="text-xs text-muted-foreground">Verified</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-lg font-semibold text-amber-500">
                  {summary.warning_count}
                </div>
                <div className="text-xs text-muted-foreground">Warnings</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <div className="text-lg font-semibold text-destructive">
                  {summary.error_count}
                </div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="divide-y">
            {sources.map((source) => (
              <div key={source.id} className="px-4 py-4 hover:bg-muted/20">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    {sourceTypeIcon(source.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {sourceTypeLabel(source.type)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusIcon(source.status)}
                        <span className="text-sm">
                          {statusLabel(source.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground">Records</div>
                        <div className="font-medium">
                          {source.record_count.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Last Sync</div>
                        <div>
                          {source.last_sync
                            ? formatDateTime(source.last_sync)
                            : "Never"}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground">Coverage</div>
                        <div>
                          {source.coverage_start && source.coverage_end
                            ? `${formatDate(source.coverage_start)} – ${formatDate(
                                source.coverage_end,
                              )}`
                            : "Unknown"}
                        </div>
                      </div>
                    </div>

                    {source.issues.length > 0 && (
                      <div className="mt-3 rounded-lg bg-destructive/10 p-2">
                        <div className="text-xs font-medium text-destructive">
                          Issues:
                        </div>
                        <ul className="mt-1 space-y-0.5 text-xs text-destructive/80">
                          {source.issues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Note */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Data integrity checks verify source authenticity and completeness.
          Warnings indicate potential issues that should be reviewed. Errors
          require immediate attention.
        </p>
      </div>
    </div>
  );
}
