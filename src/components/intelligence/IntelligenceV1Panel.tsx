"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { IntelligenceResultCard } from "@/components/IntelligenceResultCard";

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

// Local storage key for cached intelligence results.  Storing results here avoids
// re-fetching the same data on subsequent runs.
const CACHE_KEY = "intelligence_v1_cache";

export function IntelligenceV1Panel() {
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [cat, setCat] = useState<CatSuggestion[] | null>(null);
  const [dup, setDup] = useState<DuplicateGroup[] | null>(null);
  const [cash, setCash] = useState<Cashflow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setError(null);

    // Check for cached results before performing API requests.  If cached data
    // exists, populate state and skip the network calls.
    try {
      if (typeof window !== "undefined") {
        const cachedStr = window.localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cachedData = JSON.parse(cachedStr);
          setCat(cachedData.cat ?? null);
          setDup(cachedData.dup ?? null);
          setCash(cachedData.cash ?? null);
          setRan(true);
          setCached(true);
          setRunning(false);
          return;
        }
      }
    } catch (e) {
      // If parsing fails, ignore cache and proceed to fetch fresh data.
      console.error(e);
    }
    setCached(false);

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

      // Apply the confidence threshold on the client and prepare new results.
      const newCat = (c1?.suggestions ?? []).filter(
        (s) => (s.confidence ?? 0) >= THRESHOLD,
      );
      const newDup = (d1?.duplicates ?? []).filter(
        (g) => (g.confidence ?? 0) >= THRESHOLD,
      );
      const newCash = k1 && (k1.confidence ?? 0) >= THRESHOLD ? k1 : null;

      setCat(newCat);
      setDup(newDup);
      setCash(newCash);
      setRan(true);
      // Persist the filtered results to localStorage so subsequent runs can
      // immediately populate from cache without hitting the backend.
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ cat: newCat, dup: newDup, cash: newCash }),
          );
        }
      } catch (e) {
        console.error(e);
      }
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
    if (cached) return { label: "Cached", tone: "muted" as const };
    return { label: "Complete", tone: "ok" as const };
  }, [ran, error, cached]);

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
                <IntelligenceResultCard
                  key={s.transaction_id}
                  id={s.transaction_id}
                  title={s.suggested_category ?? s.category ?? "Suggestion"}
                  confidence={s.confidence}
                  explanation={s.explanation}
                  subtitle={`tx: ${s.transaction_id}`}
                  evidence={s.evidence}
                  threshold={THRESHOLD}
                />
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
                <IntelligenceResultCard
                  key={g.group_id}
                  id={g.group_id}
                  title={`Group ${g.group_id}`}
                  confidence={g.confidence}
                  explanation={g.explanation}
                  subtitle={`tx: ${g.transactions.join(", ")}`}
                  evidence={g.evidence}
                  statusVariant="warn"
                  threshold={THRESHOLD}
                />
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
            <IntelligenceResultCard
              id="cashflow-insight"
              title={cash.trend}
              confidence={cash.confidence}
              explanation={cash.explanation}
              subtitle={
                cash.forecast ? `forecast: ${cash.forecast}` : undefined
              }
              evidence={cash.evidence}
              threshold={THRESHOLD}
            />
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
