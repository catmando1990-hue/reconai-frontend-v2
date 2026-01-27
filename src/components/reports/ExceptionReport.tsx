"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Download, RefreshCw, AlertTriangle, FileText } from "lucide-react";

/**
 * Exception signal from backend engine
 */
type ExceptionSignal = {
  id: string;
  type: string;
  title: string;
  description?: string;
  entity_id?: string;
  evidence_ref?: string;
  created_at: string;
  confidence?: number;
};

/**
 * P1 Backend Response Format
 */
type SignalsResponse = {
  mode: "demo" | "live";
  signals: ExceptionSignal[];
  disclaimer?: string | null;
  request_id: string;
};

/**
 * Known exception rule types from the backend engine
 */
const EXCEPTION_RULE_TYPES = [
  "duplicate_transaction",
  "missing_receipt",
  "uncategorized_expense",
  "policy_violation",
  "threshold_exceeded",
  "approval_required",
  "reconciliation_mismatch",
  "vendor_not_approved",
];

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * ExceptionReport - Displays exception signals from backend engine
 *
 * Endpoint: GET /api/signals/p1?min_confidence=1.0
 *
 * Rules:
 * - Fetches real exception signals from backend
 * - Filters to known exception rule types
 * - No auto-refresh or polling
 * - Advisory only, no enforcement implied
 */
export function ExceptionReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [exceptions, setExceptions] = useState<ExceptionSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ran, setRan] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SignalsResponse>(
        "/api/signals/p1?min_confidence=1.0",
      );

      // Handle both array and object formats
      let signals: ExceptionSignal[];
      if (Array.isArray(data)) {
        signals = data;
      } else {
        signals = data.signals ?? [];
      }

      // Filter to known exception rule types only
      const filtered = signals.filter((s) =>
        EXCEPTION_RULE_TYPES.some(
          (ruleType) =>
            s.type?.toLowerCase().includes(ruleType) ||
            s.title?.toLowerCase().includes(ruleType.replace(/_/g, " ")),
        ),
      );

      // Sort by created_at descending (most recent first)
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setExceptions(filtered);
      setRan(true);
    } catch (e) {
      // Surface request_id on errors
      const requestId = crypto.randomUUID();
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(`${msg} (request_id: ${requestId})`);
      setRan(true);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchData();
  }, [isLoaded, fetchData]);

  const handleExportCSV = () => {
    if (exceptions.length === 0) return;

    const headers = ["Title", "Description", "Evidence Reference", "Created At"];
    const rows = exceptions.map((ex) => [
      `"${ex.title || ex.type}"`,
      `"${ex.description || ""}"`,
      `"${ex.evidence_ref || ex.entity_id || ""}"`,
      ex.created_at,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exceptions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Exception Report</h3>
          <p className="text-xs text-muted-foreground">
            Rule-based exceptions from backend engine
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
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exceptions.length === 0}
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

      {!loading && !error && ran && exceptions.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <FileText className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No exceptions detected.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This means all evaluated rules passed.
          </p>
        </div>
      )}

      {!loading && !error && exceptions.length > 0 && (
        <>
          {/* Summary */}
          <div className="border-b bg-muted/20 px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {exceptions.length} exception{exceptions.length !== 1 ? "s" : ""}{" "}
              found
            </span>
          </div>

          {/* Exception List */}
          <div className="divide-y">
            {exceptions.map((ex) => (
              <div
                key={ex.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20"
              >
                <div className="mt-0.5 rounded-full bg-amber-500/20 p-1 text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  {/* Title */}
                  <div className="font-medium">{ex.title || ex.type}</div>

                  {/* Description */}
                  {ex.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ex.description}
                    </p>
                  )}

                  {/* Evidence Reference & Timestamp */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {(ex.evidence_ref || ex.entity_id) && (
                      <span className="font-mono">
                        Ref: {ex.evidence_ref || ex.entity_id}
                      </span>
                    )}
                    <span>{formatDateTime(ex.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Disclaimer - MANDATORY */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Exceptions are advisory and rule-based. They do not imply enforcement
          or action.
        </p>
      </div>
    </div>
  );
}
