"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Download, RefreshCw, AlertTriangle } from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  merchant_name: string | null;
  name: string | null;
  amount: number;
  category: string[] | string | null;
  pending: boolean;
};

type Exception = {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  reason: string;
  severity: "high" | "medium" | "low";
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCategory(cat: string[] | string | null): string {
  if (!cat) return "";
  if (Array.isArray(cat)) return cat[0] || "";
  return cat;
}

export function ExceptionReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    let alive = true;
    setLoading(true);
    setError(null);

    apiFetch<Transaction[]>("/api/transactions")
      .then((data) => {
        if (alive) setTransactions(data);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isLoaded, apiFetch]);

  const exceptions = useMemo(() => {
    const result: Exception[] = [];

    // Calculate statistics for anomaly detection
    const amounts = transactions.map((tx) => Math.abs(tx.amount));
    const mean = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const stdDev = amounts.length > 0
      ? Math.sqrt(
          amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
            amounts.length
        )
      : 0;

    const highThreshold = mean + 3 * stdDev;
    const mediumThreshold = mean + 2 * stdDev;

    // Track merchant frequencies for duplicate detection
    const merchantDateMap = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      const merchant = tx.merchant_name || tx.name || "Unknown";
      const key = `${merchant}-${tx.date}`;
      const existing = merchantDateMap.get(key) || [];
      existing.push(tx);
      merchantDateMap.set(key, existing);
    }

    for (const tx of transactions) {
      const merchant = tx.merchant_name || tx.name || "Unknown";
      const absAmount = Math.abs(tx.amount);
      const category = getCategory(tx.category);

      // 1. Large one-off transactions (high severity)
      if (absAmount >= highThreshold && absAmount > 1000) {
        result.push({
          id: tx.id,
          date: tx.date,
          merchant,
          amount: tx.amount,
          reason: "Unusually large transaction (>3σ from mean)",
          severity: "high",
        });
        continue;
      }

      // 2. Medium-large transactions
      if (absAmount >= mediumThreshold && absAmount > 500) {
        result.push({
          id: tx.id,
          date: tx.date,
          merchant,
          amount: tx.amount,
          reason: "Large transaction (>2σ from mean)",
          severity: "medium",
        });
        continue;
      }

      // 3. Uncategorized items
      if (!category) {
        result.push({
          id: tx.id,
          date: tx.date,
          merchant,
          amount: tx.amount,
          reason: "Uncategorized transaction",
          severity: "low",
        });
        continue;
      }

      // 4. Potential duplicates (same merchant, same date, same amount)
      const key = `${merchant}-${tx.date}`;
      const sameDay = merchantDateMap.get(key) || [];
      const duplicates = sameDay.filter(
        (t) => t.id !== tx.id && Math.abs(t.amount - tx.amount) < 0.01
      );
      if (duplicates.length > 0) {
        // Only flag once per duplicate group
        const minId = Math.min(
          tx.id as unknown as number,
          ...duplicates.map((d) => d.id as unknown as number)
        );
        if ((tx.id as unknown as number) === minId) {
          result.push({
            id: tx.id,
            date: tx.date,
            merchant,
            amount: tx.amount,
            reason: `Potential duplicate (${duplicates.length + 1} matching transactions)`,
            severity: "medium",
          });
        }
      }
    }

    // Sort by severity then date
    const severityOrder = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => {
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return result;
  }, [transactions]);

  const handleExportCSV = () => {
    if (exceptions.length === 0) return;

    const headers = ["Date", "Merchant", "Amount", "Reason", "Severity"];
    const rows = exceptions.map((ex) => [
      ex.date,
      `"${ex.merchant}"`,
      ex.amount.toFixed(2),
      `"${ex.reason}"`,
      ex.severity,
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

  const severityCounts = useMemo(() => {
    return {
      high: exceptions.filter((e) => e.severity === "high").length,
      medium: exceptions.filter((e) => e.severity === "medium").length,
      low: exceptions.filter((e) => e.severity === "low").length,
    };
  }, [exceptions]);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Exception Report</h3>
          <p className="text-xs text-muted-foreground">
            Transactions that violate normal patterns • Flags for review, not
            fraud alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {!loading && !error && exceptions.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No exceptions detected. All transactions appear normal.
        </div>
      )}

      {!loading && !error && exceptions.length > 0 && (
        <>
          {/* Summary */}
          <div className="flex gap-4 border-b bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/20 text-xs text-destructive">
                {severityCounts.high}
              </span>
              <span className="text-xs text-muted-foreground">High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-600">
                {severityCounts.medium}
              </span>
              <span className="text-xs text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                {severityCounts.low}
              </span>
              <span className="text-xs text-muted-foreground">Low</span>
            </div>
          </div>

          {/* Exception List */}
          <div className="divide-y">
            {exceptions.map((ex) => (
              <div key={ex.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20">
                <div
                  className={[
                    "mt-0.5 rounded-full p-1",
                    ex.severity === "high"
                      ? "bg-destructive/20 text-destructive"
                      : ex.severity === "medium"
                      ? "bg-amber-500/20 text-amber-600"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{ex.merchant}</div>
                    <div
                      className={[
                        "font-mono text-sm whitespace-nowrap",
                        ex.amount < 0 ? "text-destructive" : "text-emerald-600",
                      ].join(" ")}
                    >
                      {ex.amount < 0 ? "-" : "+"}
                      {formatCurrency(ex.amount)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(ex.date)} • {ex.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Disclaimer */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Exceptions are statistical flags for manual review. They do not
          constitute fraud alerts or financial advice.
        </p>
      </div>
    </div>
  );
}
