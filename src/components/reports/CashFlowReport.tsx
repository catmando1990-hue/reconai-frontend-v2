"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Download, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  pending: boolean;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

export function CashFlowReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"30" | "60" | "90" | "all">("30");

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

  const { filteredTx, inflows, outflows, netCash, periodLabel } = useMemo(() => {
    const now = new Date();
    let cutoff: Date | null = null;
    let periodLabel = "All Time";

    if (period !== "all") {
      const days = parseInt(period);
      cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      periodLabel = `Last ${days} Days`;
    }

    // Only cleared transactions (not pending) for direct method
    const filteredTx = transactions.filter((tx) => {
      if (tx.pending) return false;
      if (cutoff) {
        return new Date(tx.date) >= cutoff;
      }
      return true;
    });

    let inflows = 0;
    let outflows = 0;

    for (const tx of filteredTx) {
      if (tx.amount > 0) {
        inflows += tx.amount;
      } else {
        outflows += Math.abs(tx.amount);
      }
    }

    return {
      filteredTx,
      inflows,
      outflows,
      netCash: inflows - outflows,
      periodLabel,
    };
  }, [transactions, period]);

  const handleExportCSV = () => {
    const headers = ["Metric", "Amount"];
    const rows = [
      ["Period", periodLabel],
      ["Total Inflows", inflows.toFixed(2)],
      ["Total Outflows", outflows.toFixed(2)],
      ["Net Cash Movement", netCash.toFixed(2)],
      ["Transaction Count", filteredTx.length.toString()],
    ];

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cash-flow-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Cash Flow Statement</h3>
          <p className="text-xs text-muted-foreground">
            Direct method • Cleared transactions only • No projections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="rounded-lg border bg-background px-2 py-1 text-xs"
          >
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
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

      {!loading && !error && (
        <div className="p-4 space-y-4">
          {/* Period Label */}
          <div className="text-sm text-muted-foreground">
            {periodLabel} • {filteredTx.length} cleared transactions
          </div>

          {/* Cash Flow Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Inflows */}
            <div className="rounded-xl border bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Operating Inflows</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600">
                +{formatCurrency(inflows)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Money received
              </div>
            </div>

            {/* Outflows */}
            <div className="rounded-xl border bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">Operating Outflows</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-destructive">
                -{formatCurrency(outflows)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Money spent
              </div>
            </div>

            {/* Net */}
            <div
              className={[
                "rounded-xl border p-4",
                netCash >= 0 ? "bg-emerald-500/5" : "bg-destructive/5",
              ].join(" ")}
            >
              <div
                className={[
                  "flex items-center gap-2",
                  netCash >= 0 ? "text-emerald-600" : "text-destructive",
                ].join(" ")}
              >
                {netCash >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Net Cash Movement</span>
              </div>
              <div
                className={[
                  "mt-2 text-2xl font-bold",
                  netCash >= 0 ? "text-emerald-600" : "text-destructive",
                ].join(" ")}
              >
                {netCash >= 0 ? "+" : "-"}
                {formatCurrency(netCash)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {netCash >= 0 ? "Positive cash flow" : "Negative cash flow"}
              </div>
            </div>
          </div>

          {/* Breakdown Bar */}
          {(inflows > 0 || outflows > 0) && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Inflow/Outflow Ratio
              </div>
              <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-emerald-500"
                  style={{
                    width: `${(inflows / (inflows + outflows)) * 100}%`,
                  }}
                />
                <div
                  className="bg-destructive"
                  style={{
                    width: `${(outflows / (inflows + outflows)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Inflows:{" "}
                  {((inflows / (inflows + outflows)) * 100).toFixed(1)}%
                </span>
                <span>
                  Outflows:{" "}
                  {((outflows / (inflows + outflows)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Based only on cleared transactions. No accrual logic or projections.
          Pending transactions excluded.
        </p>
      </div>
    </div>
  );
}
