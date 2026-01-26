"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { auditedFetch } from "@/lib/auditedFetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Check, X, Loader2, ChevronDown } from "lucide-react";

// Common transaction categories
const CATEGORY_OPTIONS = [
  "Software & SaaS",
  "Transportation",
  "Groceries",
  "Dining & Restaurants",
  "Utilities",
  "Office Supplies",
  "Professional Services",
  "Insurance",
  "Rent & Lease",
  "Travel",
  "Entertainment",
  "Marketing & Advertising",
  "Payroll",
  "Equipment",
  "Healthcare",
  "Education & Training",
  "Bank Fees",
  "Taxes",
  "Other",
];

const CUSTOM_OPTION = "✏️ Custom...";

type CatSuggestion = {
  transaction_id: string;
  merchant_name?: string;
  description?: string;
  amount?: number;
  date?: string;
  category?: string;
  current_category?: string;
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
  _rules_applied?: number;
  _timestamp?: string;
};

const THRESHOLD = 0.85;
const CACHE_KEY = "intelligence_v1_cache";

/**
 * Category selector dropdown with custom text input option
 */
function CategorySelector({
  suggestion,
  onApply,
  onDismiss,
  isApplying,
}: {
  suggestion: CatSuggestion;
  onApply: (suggestion: CatSuggestion, category: string) => Promise<void>;
  onDismiss: (transactionId: string) => void;
  isApplying: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState(
    suggestion.suggested_category || CATEGORY_OPTIONS[0],
  );
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectCategory = (cat: string) => {
    if (cat === CUSTOM_OPTION) {
      setIsCustomMode(true);
      setCustomCategory("");
    } else {
      setIsCustomMode(false);
      setSelectedCategory(cat);
    }
    setIsOpen(false);
  };

  const handleApply = async () => {
    const categoryToApply = isCustomMode
      ? customCategory.trim()
      : selectedCategory;
    if (!categoryToApply) return;
    await onApply(suggestion, categoryToApply);
  };

  const displayValue = isCustomMode
    ? customCategory || "Enter category..."
    : selectedCategory;

  const canApply = isCustomMode ? customCategory.trim().length > 0 : true;

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* Custom text input mode */}
      {isCustomMode ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Type category..."
            className="w-36 rounded-md border border-border bg-card px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && canApply) {
                void handleApply();
              }
              if (e.key === "Escape") {
                setIsCustomMode(false);
                setSelectedCategory(
                  suggestion.suggested_category || CATEGORY_OPTIONS[0],
                );
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCustomMode(false);
              setSelectedCategory(
                suggestion.suggested_category || CATEGORY_OPTIONS[0],
              );
            }}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      ) : (
        /* Category dropdown */
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isApplying}
            className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            <span className="max-w-30 truncate">{displayValue}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full z-20 mt-1 max-h-60 w-48 overflow-auto rounded-md border border-border bg-card shadow-lg">
                {/* Custom option at top */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory(CUSTOM_OPTION)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b border-border text-primary font-medium"
                >
                  {CUSTOM_OPTION}
                </button>
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                      cat === selectedCategory && !isCustomMode
                        ? "bg-muted font-medium"
                        : ""
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Apply button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleApply()}
        disabled={isApplying || !canApply}
        className="text-primary border-primary hover:bg-primary/10"
      >
        {isApplying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Check className="h-4 w-4 mr-1" />
            Apply
          </>
        )}
      </Button>

      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDismiss(suggestion.transaction_id)}
        disabled={isApplying}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Intelligence V1 Panel - Claude-powered transaction analysis
 * Saves category rules for learning when user applies categories
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
  const [rulesApplied, setRulesApplied] = useState<number | null>(null);
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
          setRulesApplied(cachedData.rulesApplied ?? null);
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
      setRulesApplied(response._rules_applied ?? null);
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
              rulesApplied: response._rules_applied,
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
    setRulesApplied(null);
    setRan(false);
    setCached(false);
    setError(null);
    setAppliedIds(new Set());
    setDismissedIds(new Set());
  };

  const handleApply = async (suggestion: CatSuggestion, category: string) => {
    setApplyingId(suggestion.transaction_id);
    try {
      // 1. Update transaction category
      // auditedFetch returns parsed JSON directly, throws HttpError on failure
      await auditedFetch(
        `/api/transactions/${suggestion.transaction_id}/category`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        },
      );

      // 2. Save category rule for learning (merchant → category mapping)
      const merchantPattern =
        suggestion.merchant_name || suggestion.description;
      if (merchantPattern) {
        try {
          await auditedFetch("/api/intelligence/rules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              merchant_pattern: merchantPattern,
              category: category,
            }),
          });
        } catch {
          // Don't fail if rule save fails - transaction is already updated
        }
      }

      setAppliedIds((prev) => new Set(prev).add(suggestion.transaction_id));
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
    (s) =>
      !dismissedIds.has(s.transaction_id) && !appliedIds.has(s.transaction_id),
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
              Claude-powered analysis with learning.
              {txCount !== null && ran && (
                <span className="ml-1">
                  {txCount} transactions
                  {rulesApplied !== null && rulesApplied > 0 && (
                    <span className="text-primary">
                      {" "}
                      · {rulesApplied} rules applied
                    </span>
                  )}
                </span>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-primary">
                          Suggested: {s.suggested_category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(s.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.explanation}
                      </p>
                      {/* Transaction details */}
                      <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                        <p className="font-medium text-foreground">
                          {s.merchant_name ||
                            s.description ||
                            "Unknown merchant"}
                        </p>
                        <p>
                          {s.amount !== undefined && s.amount !== null
                            ? `$${Math.abs(s.amount).toFixed(2)}`
                            : ""}
                          {s.date && ` · ${s.date}`}
                          {s.current_category &&
                            ` · Current: ${s.current_category}`}
                        </p>
                      </div>
                    </div>

                    {/* Category selector with Apply/Dismiss */}
                    <CategorySelector
                      suggestion={s}
                      onApply={handleApply}
                      onDismiss={handleDismiss}
                      isApplying={applyingId === s.transaction_id}
                    />
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
