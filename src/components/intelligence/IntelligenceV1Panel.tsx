"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/dashboard/StatusChip";

type CatSuggestion = {
  transaction_id: string;
  category?: string;
  suggested_category?: string;
  confidence: number;
  explanation: string;
  evidence?: unknown;
};

type DuplicateGroup = {
  group_id: string;
  transactions: string[];
  confidence: number;
  explanation: string;
  evidence?: unknown;
};

type Cashflow = {
  trend: string;
  forecast?: string;
  confidence: number;
  explanation: string;
  evidence?: unknown;
};

const THRESHOLD = 0.85;

export function IntelligenceV1Panel() {
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [cat, setCat] = useState<CatSuggestion[] | null>(null);
  const [dup, setDup] = useState<DuplicateGroup[] | null>(null);
  const [cash, setCash] = useState<Cashflow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setError(null);

    try {
      const [c1, d1, k1] = await Promise.all([
        apiFetch<{ suggestions: CatSuggestion[] }>(
          "/api/intelligence/categorization/suggestions",
        ),
        apiFetch<{ duplicates: DuplicateGroup[] }>(
          "/api/intelligence/duplicates",
        ),
        apiFetch<Cashflow>("/api/intelligence/cashflow/insights"),
      ]);

      setCat(
        (c1?.suggestions ?? []).filter((s) => (s.confidence ?? 0) >= THRESHOLD),
      );
      setDup(
        (d1?.duplicates ?? []).filter((g) => (g.confidence ?? 0) >= THRESHOLD),
      );
      setCash(k1 && (k1.confidence ?? 0) >= THRESHOLD ? k1 : null);
      setRan(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setRan(true);
    } finally {
      setRunning(false);
    }
  };

  const status = useMemo(() => {
    if (!ran) return { label: "Manual run", tone: "muted" as const };
    if (error) return { label: "Error", tone: "warn" as const };
    return { label: "Complete", tone: "ok" as const };
  }, [ran, error]);

  return (
    <Card className="border bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              Intelligence v1 (Advisory)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Opt-in run. Read-only outputs must include confidence,
              explanation, and evidence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip variant={status.tone}>{status.label}</StatusChip>
            <Button
              variant="outline"
              onClick={() => void run()}
              disabled={running}
            >
              {running ? "Running…" : "Run"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : null}

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Categorization Suggestions</h3>
            <span className="text-xs text-muted-foreground">
              threshold {THRESHOLD}
            </span>
          </div>
          {cat?.length ? (
            <div className="space-y-2">
              {cat.slice(0, 6).map((s) => (
                <div
                  key={s.transaction_id}
                  className="rounded-xl border border-border/70 bg-background/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">
                      {s.suggested_category ?? s.category ?? "Suggestion"}
                    </div>
                    <StatusChip variant="muted">
                      {Math.round(s.confidence * 100)}%
                    </StatusChip>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.explanation}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    tx: {s.transaction_id}
                  </p>
                </div>
              ))}
            </div>
          ) : ran ? (
            <p className="text-sm text-muted-foreground">
              No suggestions met the confidence threshold.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run to generate suggestions.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Duplicate Detection</h3>
            <span className="text-xs text-muted-foreground">
              threshold {THRESHOLD}
            </span>
          </div>
          {dup?.length ? (
            <div className="space-y-2">
              {dup.slice(0, 6).map((g) => (
                <div
                  key={g.group_id}
                  className="rounded-xl border border-border/70 bg-background/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">
                      Group {g.group_id}
                    </div>
                    <StatusChip variant="warn">
                      {Math.round(g.confidence * 100)}%
                    </StatusChip>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {g.explanation}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    tx: {g.transactions.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ) : ran ? (
            <p className="text-sm text-muted-foreground">
              No duplicate groups met the confidence threshold.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run to evaluate duplicate groups.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Cashflow Insight</h3>
            <span className="text-xs text-muted-foreground">
              threshold {THRESHOLD}
            </span>
          </div>
          {cash ? (
            <div className="rounded-xl border border-border/70 bg-background/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium capitalize">
                  {cash.trend}
                </div>
                <StatusChip variant="muted">
                  {Math.round(cash.confidence * 100)}%
                </StatusChip>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {cash.explanation}
              </p>
              {cash.forecast ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  forecast: {cash.forecast}
                </p>
              ) : null}
            </div>
          ) : ran ? (
            <p className="text-sm text-muted-foreground">
              No cashflow insight met the confidence threshold.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run to generate a cashflow summary.
            </p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
