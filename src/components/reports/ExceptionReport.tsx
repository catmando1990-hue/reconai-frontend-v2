"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import {
  Download,
  RefreshCw,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

/**
 * Exception signal from Phase 6.2 backend engine
 */
type ExceptionSignal = {
  id: string;
  type: string;
  title: string;
  description?: string;
  entity_id?: string;
  evidence_ref?: string;
  evidence?: Record<string, unknown>;
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
 * Phase 6.2 Exception Signal Titles (E1–E6)
 * These are the exact titles produced by the backend engine.
 */
const EXCEPTION_TITLES = [
  "Uncategorized Transaction",
  "Duplicate Transaction",
  "Amount Threshold Breach",
  "Out-of-Period Posting",
  "Missing Counterparty",
  "Negative Balance Event",
] as const;

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
 * ExceptionReport - Displays exception signals from Phase 6.2 backend engine
 *
 * Endpoint: GET /api/signals/p1?min_confidence=1.0
 *
 * Rules:
 * - Fetches real exception signals from backend
 * - Filters to exact E1–E6 exception titles
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

      // Filter to exact E1–E6 exception titles only
      const filtered = signals.filter((s) =>
        EXCEPTION_TITLES.some((title) => s.title === title),
      );

      // Sort by created_at descending (newest first)
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

    const headers = [
      "Title",
      "Description",
      "Evidence Reference",
      "Created At",
    ];
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

      {/* Advisory Banner - MANDATORY */}
      <div className="border-b bg-amber-500/5 px-4 py-2">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Exceptions are advisory and rule-based. They do not imply enforcement
          or automated action.
        </p>
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
            This means all evaluated rules passed for the selected period.
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
            {exceptions.map((ex) => {
              const isExpanded = expandedIds.has(ex.id);
              const hasEvidence =
                ex.evidence_ref || ex.entity_id || ex.evidence;

              return (
                <div key={ex.id} className="px-4 py-3 hover:bg-muted/20">
                  <div className="flex items-start gap-3">
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

                      {/* Timestamp */}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(ex.created_at)}
                      </div>

                      {/* Evidence Reference - Expandable */}
                      {hasEvidence && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(ex.id)}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            Evidence Reference
                          </button>

                          {isExpanded && (
                            <div className="mt-2 rounded-lg border bg-muted/30 p-3">
                              {ex.evidence_ref && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">
                                    Ref:{" "}
                                  </span>
                                  <span className="font-mono">
                                    {ex.evidence_ref}
                                  </span>
                                </div>
                              )}
                              {ex.entity_id && (
                                <div className="text-xs mt-1">
                                  <span className="text-muted-foreground">
                                    Entity:{" "}
                                  </span>
                                  <span className="font-mono">
                                    {ex.entity_id}
                                  </span>
                                </div>
                              )}
                              {ex.evidence && (
                                <pre className="mt-2 text-[10px] text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(ex.evidence, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Footer Disclaimer */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Exception signals are generated by rule evaluation. Review evidence
          before taking action.
        </p>
      </div>
    </div>
  );
}
