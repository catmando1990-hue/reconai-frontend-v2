"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, ChevronRight, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/dashboard/StatusChip";

// Confidence threshold for displaying signals (matches IntelligenceV1Panel)
const CONFIDENCE_THRESHOLD = 0.85;

type Signal = {
  id: string;
  type: string;
  entity_id?: string;
  severity?: "low" | "medium" | "high";
  message?: string;
  created_at?: string;
  confidence?: number;
  explanation?: string;
};

type SignalEvidence = {
  rule: string;
  entity_id: string;
  transactions?: Array<{
    id: string;
    date?: string;
    merchant?: string;
    amount?: number;
  }>;
};

/**
 * SignalsPanel - Manual-trigger signals viewer
 *
 * LAWS COMPLIANCE:
 * - NO AUTO-EXECUTION: Requires manual "Fetch Signals" button click
 * - ADVISORY ONLY: Read-only display with evidence viewer
 * - CONFIDENCE CONTRACT: Filters signals below 0.85 confidence threshold
 */
export default function SignalsPanel() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<SignalEvidence | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual fetch - NO AUTO-EXECUTION
  const fetchSignals = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<Signal[]>("/api/signals");
      // Apply confidence threshold filter
      const filteredSignals = (data ?? []).filter(
        (s) => (s.confidence ?? 0) >= CONFIDENCE_THRESHOLD,
      );
      setSignals(filteredSignals);
      setRan(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch signals");
      setRan(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvidence = async (signalId: string) => {
    setSelectedSignal(signalId);
    setEvidenceLoading(true);
    try {
      const data = await apiFetch<SignalEvidence>(
        `/api/signals/${signalId}/evidence`,
      );
      setEvidence(data);
    } catch {
      setEvidence(null);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const closeEvidence = () => {
    setSelectedSignal(null);
    setEvidence(null);
  };

  // Determine status for display
  const status = ran
    ? error
      ? { label: "Error", tone: "warn" as const }
      : { label: "Complete", tone: "ok" as const }
    : { label: "Manual run", tone: "muted" as const };

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      {/* Header with manual trigger */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Signals (Advisory)
        </div>
        <div className="flex items-center gap-2">
          <StatusChip variant={status.tone}>{status.label}</StatusChip>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchSignals()}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Fetching...
              </>
            ) : (
              "Fetch Signals"
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Manual-run only. Results filtered to confidence &ge;{" "}
        {CONFIDENCE_THRESHOLD * 100}%.
      </p>

      {/* Error state */}
      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      {/* Pre-run state */}
      {!ran && !loading && (
        <p className="text-sm text-muted-foreground">
          Click &quot;Fetch Signals&quot; to check for anomalies, duplicate
          transactions, or unusual patterns in your financial data.
        </p>
      )}

      {/* Empty state after run */}
      {ran && !error && signals.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No signals met the confidence threshold ({CONFIDENCE_THRESHOLD * 100}
          %). This means no high-confidence anomalies were detected.
        </p>
      )}

      {/* Signals list */}
      {signals.length > 0 && (
        <ul className="space-y-2">
          {signals.map((signal) => (
            <li
              key={signal.id}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    signal.severity === "high"
                      ? "bg-red-500"
                      : signal.severity === "medium"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  }`}
                />
                <span className="text-muted-foreground truncate">
                  {signal.message ??
                    `${signal.type} detected${signal.entity_id ? ` (${signal.entity_id})` : ""}`}
                </span>
                {signal.confidence !== undefined && (
                  <StatusChip
                    variant={signal.confidence >= 0.9 ? "ok" : "warn"}
                  >
                    {Math.round(signal.confidence * 100)}%
                  </StatusChip>
                )}
              </div>
              <button
                type="button"
                onClick={() => fetchEvidence(signal.id)}
                className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 ml-2"
              >
                Evidence
                <ChevronRight className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Evidence Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Signal Evidence</h3>
              <button
                type="button"
                onClick={closeEvidence}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {evidenceLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-card/20 rounded w-1/2" />
                <div className="h-20 bg-card/20 rounded" />
              </div>
            ) : evidence ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Rule
                  </div>
                  <div className="text-sm text-foreground">{evidence.rule}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Entity
                  </div>
                  <div className="text-sm text-foreground">
                    {evidence.entity_id}
                  </div>
                </div>

                {evidence.transactions && evidence.transactions.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      Related Transactions
                    </div>
                    <ul className="space-y-1 text-sm">
                      {evidence.transactions.map((tx) => (
                        <li
                          key={tx.id}
                          className="flex justify-between text-muted-foreground"
                        >
                          <span>
                            {tx.date} — {tx.merchant ?? "Unknown"}
                          </span>
                          <span className="font-mono">
                            {typeof tx.amount === "number"
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                }).format(tx.amount)
                              : "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No evidence available.
              </div>
            )}

            {/* Advisory footer */}
            <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
              Evidence is provided for transparency. Results should be verified
              before taking action.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
