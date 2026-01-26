"use client";

import { useEffect, useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { RefreshCw } from "lucide-react";

type CashFlowData = {
  period: string;
  inflows: number;
  outflows: number;
  net: number;
  inflow_transactions: number;
  outflow_transactions: number;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

export default function CashFlowPage() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const result = await apiFetch<{ cashflow: CashFlowData }>(
          "/api/reports/cash-flow",
        );
        if (alive) setData(result.cashflow);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [authReady, apiFetch]);

  return (
    <RouteShell
      title="Cash Flow Statement"
      subtitle="Direct method — actual money in vs money out. Based only on cleared transactions."
    >
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Total Inflows
              </div>
              <div className="mt-2 text-2xl font-semibold text-green-600">
                +{formatCurrency(data.inflows)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {data.inflow_transactions} transactions
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Total Outflows
              </div>
              <div className="mt-2 text-2xl font-semibold text-red-500">
                -{formatCurrency(data.outflows)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {data.outflow_transactions} transactions
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Net Cash Movement
              </div>
              <div
                className={`mt-2 text-2xl font-semibold ${
                  data.net >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {data.net >= 0 ? "+" : "-"}
                {formatCurrency(data.net)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {data.period}
              </div>
            </div>
          </div>

          {/* Cash Flow Breakdown */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="font-semibold">Cash Flow Breakdown</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Based only on posted (cleared) transactions
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-sm">Operating Inflows</span>
                <span className="font-mono text-sm text-green-600">
                  +{formatCurrency(data.inflows)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-sm">Operating Outflows</span>
                <span className="font-mono text-sm text-red-500">
                  -{formatCurrency(data.outflows)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 font-semibold">
                <span className="text-sm">Net Cash Movement</span>
                <span
                  className={`font-mono text-sm ${
                    data.net >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {data.net >= 0 ? "+" : "-"}
                  {formatCurrency(data.net)}
                </span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This is a direct-method cash flow statement
              showing actual money movement. No accrual adjustments, no
              projections. Pending transactions are excluded.
            </p>
          </div>
        </div>
      )}
    </RouteShell>
  );
}
