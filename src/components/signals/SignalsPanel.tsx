"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, ChevronRight, X } from "lucide-react";

type Signal = {
  id: string;
  type: string;
  entity_id?: string;
  severity?: "low" | "medium" | "high";
  message?: string;
  created_at?: string;
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

export default function SignalsPanel() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<SignalEvidence | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<Signal[]>("/api/signals");
        if (alive) setSignals(data);
      } catch {
        // Silent: empty array on failure
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

  // Don't render if loading or no signals
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-24 bg-card/20 rounded" />
          <div className="h-8 bg-card/20 rounded" />
        </div>
      </div>
    );
  }

  if (signals.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Signals ({signals.length})
      </div>

      <ul className="space-y-2">
        {signals.map((signal) => (
          <li
            key={signal.id}
            className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  signal.severity === "high"
                    ? "bg-red-500"
                    : signal.severity === "medium"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                }`}
              />
              <span className="text-muted-foreground">
                {signal.message ??
                  `${signal.type} detected${signal.entity_id ? ` (${signal.entity_id})` : ""}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => fetchEvidence(signal.id)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Evidence
              <ChevronRight className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>

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
          </div>
        </div>
      )}
    </div>
  );
}
