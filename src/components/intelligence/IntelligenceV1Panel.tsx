"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { IntelligenceResultCard } from "@/components/shared/IntelligenceResultCard";

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
  forecast?: string | null;
  confidence: number;
  explanation: string;
  evidence?: unknown;
};

type AnalyzeResponse = {
  suggestions: CatSuggestion[];
  duplicates: DuplicateGroup[];
  cashflow: Cashflow | null;
  request_id: string;
  _analyzed: boolean;
  _reason?: string;
  _transaction_count?: number;
  _timestamp?: string;
};

const THRESHOLD = 0.85;

// Local storage key for cached intelligence results
const CACHE_KEY = "intelligence_v1_cache";

/**
 * Intelligence V1 Panel - Claude-powered transaction analysis
 *
 * Calls /api/intelligence/analyze ONCE to get all data.
 * Results are advisory only - no writes, no mutations.
 */
export function IntelligenceV1Panel() {
  const { apiFetch } = useApi();

  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [cat, setCat] = useState<CatSuggestion[] | null>(null);
  const [dup, setDup] = useState<DuplicateGroup[] | null>(null);
  const [cash, setCash] = useState<Cashflow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [txCount, setTxCount] = useState<number | null>(null);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setError(null);

    // Check for cached results before performing API request
    try {
      if (typeof window !== "undefined") {
        const cachedStr = window.localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cachedData = JSON.parse(cachedStr);
          setCat(cachedData.cat ?? null);
          setDup(cachedData.dup ?? null);
          setCash(cachedData.cash ?? null);
          setTxCount(cachedData.txCount ?? null);
          setRan(true);
          setCached(true);
          setRunning(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setCached(false);

    try {
      // Single API call to analyze endpoint
      const response = await apiFetch<AnalyzeResponse>(
        "/api/intelligence/analyze",
        { method: "POST" },
      );

      if (!response) {
        setError("No response from analysis");
        setRan(true);
        setRunning(false);
        return;
      }

      if (!response._analyzed) {
        setError(response._reason || "Analysis not available");
        setRan(true);
        setRunning(false);
        return;
      }

      // Apply confidence threshold
      const newCat = (response.suggestions ?? []).filter(
        (s) => (s.confidence ?? 0) >= THRESHOLD,
      );
      const newDup = (response.duplicates ?? []).filter(
        (g) => (g.confidence ?? 0) >= THRESHOLD,
      );
      const newCash =
        response.cashflow && (response.cashflow.confidence ?? 0) >= THRESHOLD
          ? response.cashflow
          : null;

      setCat(newCat);
      setDup(newDup);
      setCash(newCash);
      setTxCount(response._transaction_count ?? null);
      setRan(true);

      // Persist to localStorage
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              cat: newCat,
              dup: newDup,
              cash: newCash,
              txCount: response._transaction_count,
            }),
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

  const clearCache = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(CACHE_KEY);
      }
    } catch (e) {
      console.error(e);
    }
    setCat(null);
    setDup(null);
    setCash(null);
    setTxCount(null);
    setRan(false);
    setCached(false);
    setError(null);
  };

  const status = useMemo(() => {
    if (!ran) return { label: "Manual run", tone: "muted" as const };
    if (error) return { label: "Error", tone: "warn" as const };
    if (cached) return { label: "Cached", tone: "muted" as const };
    return { label: "Complete", tone: "ok" as const };
  }, [ran, error, cached]);

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              Intelligence v1 (Advisory)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Claude-powered analysis. Read-only outputs with confidence,
              explanation, and evidence.
              {txCount !== null && ran && (
                <span className="ml-2">({txCount} transactions analyzed)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip variant={status.tone}>{status.label}</StatusChip>
            {cached && (
              <Button variant="ghost" size="sm" onClick={clearCache}>
                Clear
              </Button>
            )}
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
          <p className="text-sm text-destructive">{error}</p>
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
          ) : ran && !error ? (
            <p className="text-sm text-muted-foreground">
              No suggestions met the confidence threshold.
            </p>
          ) : !ran ? (
            <p className="text-sm text-muted-foreground">
              Run to generate suggestions.
            </p>
          ) : null}
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
          ) : ran && !error ? (
            <p className="text-sm text-muted-foreground">
              No duplicate groups met the confidence threshold.
            </p>
          ) : !ran ? (
            <p className="text-sm text-muted-foreground">
              Run to evaluate duplicate groups.
            </p>
          ) : null}
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
          ) : ran && !error ? (
            <p className="text-sm text-muted-foreground">
              No cashflow insight met the confidence threshold.
            </p>
          ) : !ran ? (
            <p className="text-sm text-muted-foreground">
              Run to generate a cashflow summary.
            </p>
          ) : null}
        </section>
      </CardContent>
    </Card>
  );
}
