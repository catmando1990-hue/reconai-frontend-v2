"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Check, X, Loader2 } from "lucide-react";

type CatSuggestion = {
  transaction_id: string;
  merchant_name?: string;
  description?: string;
  amount?: number;
  date?: string;
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
const CACHE_KEY = "intelligence_v1_cache";

/**
 * Intelligence V1 Panel - Claude-powered transaction analysis
 * With Apply/Dismiss functionality for categorization suggestions
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
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setError(null);

    // Check cache
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

      // Cache
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
    setAppliedIds(new Set());
    setDismissedIds(new Set());
  };

  const handleApply = async (suggestion: CatSuggestion) => {
    if (!suggestion.suggested_category) return;
    
    setApplyingId(suggestion.transaction_id);
    try {
      const response = await fetch(
        `/api/transactions/${suggestion.transaction_id}/category`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: suggestion.suggested_category }),
        },
      );

      if (response.ok) {
        setAppliedIds((prev) => new Set(prev).add(suggestion.transaction_id));
      } else {
        const err = await response.json();
        console.error("Failed to apply category:", err);
      }
    } catch (err) {
      console.error("Apply error:", err);
    } finally {
      setApplyingId(null);
    }
  };

  const handleDismiss = (transactionId: string) => {
    setDismissedIds((prev) => new Set(prev).add(transactionId));
  };

  const status = useMemo(() => {
    if (!ran) return { label: "Manual run", tone: "muted" as const };
    if (error) return { label: "Error", tone: "warn" as const };
    if (cached) return { label: "Cached", tone: "muted" as const };
    return { label: "Complete", tone: "ok" as const };
  }, [ran, error, cached]);

  // Filter out dismissed and applied
  const visibleCat = cat?.filter(
    (s) => !dismissedIds.has(s.transaction_id) && !appliedIds.has(s.transaction_id),
  );

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              Intelligence v1 (Advisory)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Claude-powered analysis. Read-only outputs with confidence and explanation.
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
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Categorization Suggestions */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Categorization Suggestions</h3>
            <span className="text-xs text-muted-foreground">
              threshold {THRESHOLD}
            </span>
          </div>
          {visibleCat?.length ? (
            <div className="space-y-2">
              {visibleCat.slice(0, 6).map((s) => (
                <div
                  key={s.transaction_id}
                  className="rounded-lg border border-border bg-muted p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">
                          {s.suggested_category ?? s.category ?? "Suggestion"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(s.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.explanation}
                      </p>
                      {/* Show merchant/description instead of transaction_id */}
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.merchant_name || s.description || `Transaction ${s.transaction_id.slice(0, 8)}...`}
                        {s.amount !== undefined && ` · $${Math.abs(s.amount).toFixed(2)}`}
                        {s.date && ` · ${s.date}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleApply(s)}
                        disabled={applyingId === s.transaction_id}
                        className="text-primary border-primary hover:bg-primary/10"
                      >
                        {applyingId === s.transaction_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Apply
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(s.transaction_id)}
                        disabled={applyingId === s.transaction_id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
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

        {/* Duplicate Detection */}
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
                  className="rounded-lg border border-border bg-muted p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-amber-500">
                      Potential Duplicate
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(g.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {g.explanation}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {g.transactions.length} transactions flagged
                  </p>
                </div>
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

        {/* Cashflow Insight */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Cashflow Insight</h3>
            <span className="text-xs text-muted-foreground">
              threshold {THRESHOLD}
            </span>
          </div>
          {cash ? (
            <div className="rounded-lg border border-border bg-muted p-3">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{cash.trend}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(cash.confidence * 100)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {cash.explanation}
              </p>
              {cash.forecast && (
                <p className="text-xs text-muted-foreground mt-1">
                  Forecast: {cash.forecast}
                </p>
              )}
            </div>
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
