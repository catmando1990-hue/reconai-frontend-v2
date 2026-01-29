"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import {
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

type CashFlowCategory = {
  category: string;
  amount: number;
  transaction_count: number;
};

type CashFlowSection = {
  inflows: number;
  outflows: number;
  net: number;
  items: CashFlowCategory[];
};

type DailyTrend = {
  date: string;
  inflows: number;
  outflows: number;
  net: number;
  cumulative: number;
};

type CashFlowData = {
  period: string;
  start_date: string;
  end_date: string;
  operating: CashFlowSection;
  investing: CashFlowSection;
  financing: CashFlowSection;
  net_change: number;
  opening_balance: number;
  closing_balance: number;
  daily_trend: DailyTrend[];
};

type CashFlowResponse = {
  data: CashFlowData;
  request_id: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount));
}

function AwaitingDataState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <DollarSign className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">Awaiting Data</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Cash flow analysis will appear here once transaction data is available.
        Connect a bank account to start tracking inflows and outflows.
      </p>
    </div>
  );
}

export function CashFlowReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"30" | "60" | "90">("30");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<CashFlowResponse>(
        `/api/reports/cash-flow?period=${period}`
      );
      // Handle both response formats
      const reportData = response?.data ?? (response as unknown as CashFlowData);
      setData(reportData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, period]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchData();
  }, [isLoaded, fetchData]);

  const handleExportCSV = () => {
    if (!data) return;

    const headers = ["Metric", "Amount"];
    const rows = [
      ["Period", `${period} days`],
      ["Operating Inflows", data.operating.inflows.toFixed(2)],
      ["Operating Outflows", data.operating.outflows.toFixed(2)],
      ["Operating Net", data.operating.net.toFixed(2)],
      ["Investing Net", data.investing.net.toFixed(2)],
      ["Financing Net", data.financing.net.toFixed(2)],
      ["Net Change", data.net_change.toFixed(2)],
      ["Opening Balance", data.opening_balance.toFixed(2)],
      ["Closing Balance", data.closing_balance.toFixed(2)],
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

  const hasData =
    data &&
    (data.operating.inflows > 0 ||
      data.operating.outflows > 0 ||
      data.investing.net !== 0 ||
      data.financing.net !== 0);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Cash Flow Statement</h3>
          <p className="text-xs text-muted-foreground">
            Operating, investing, and financing activities
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
          </select>
          <button
            type="button"
            onClick={() => void fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!hasData}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50 disabled:opacity-50"
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
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && !hasData && <AwaitingDataState />}

      {!loading && !error && hasData && data && (
        <div className="p-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Inflows */}
            <div className="rounded-xl border bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Total Inflows</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600">
                +{formatCurrency(data.operating.inflows)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Money received
              </div>
            </div>

            {/* Outflows */}
            <div className="rounded-xl border bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">Total Outflows</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-destructive">
                -{formatCurrency(data.operating.outflows)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Money spent
              </div>
            </div>

            {/* Net */}
            <div
              className={[
                "rounded-xl border p-4",
                data.net_change >= 0 ? "bg-emerald-500/5" : "bg-destructive/5",
              ].join(" ")}
            >
              <div
                className={[
                  "flex items-center gap-2",
                  data.net_change >= 0 ? "text-emerald-600" : "text-destructive",
                ].join(" ")}
              >
                {data.net_change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Net Cash Change</span>
              </div>
              <div
                className={[
                  "mt-2 text-2xl font-bold",
                  data.net_change >= 0 ? "text-emerald-600" : "text-destructive",
                ].join(" ")}
              >
                {data.net_change >= 0 ? "+" : "-"}
                {formatCurrency(data.net_change)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {data.net_change >= 0 ? "Positive cash flow" : "Negative cash flow"}
              </div>
            </div>
          </div>

          {/* Operating Activities Breakdown */}
          {data.operating.items.length > 0 && (
            <div className="rounded-xl border p-4">
              <h4 className="text-sm font-semibold mb-3">Operating Activities</h4>
              <div className="space-y-2">
                {data.operating.items.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{item.category}</span>
                    <span
                      className={`font-mono ${
                        item.amount >= 0 ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      {item.amount >= 0 ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Balance Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">Opening Balance</div>
              <div className="mt-1 text-lg font-semibold font-mono">
                {formatCurrency(data.opening_balance)}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">Closing Balance</div>
              <div className="mt-1 text-lg font-semibold font-mono">
                {formatCurrency(data.closing_balance)}
              </div>
            </div>
          </div>

          {/* Inflow/Outflow Ratio Bar */}
          {(data.operating.inflows > 0 || data.operating.outflows > 0) && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Inflow/Outflow Ratio
              </div>
              <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-emerald-500"
                  style={{
                    width: `${
                      (data.operating.inflows /
                        (data.operating.inflows + data.operating.outflows)) *
                      100
                    }%`,
                  }}
                />
                <div
                  className="bg-destructive"
                  style={{
                    width: `${
                      (data.operating.outflows /
                        (data.operating.inflows + data.operating.outflows)) *
                      100
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Inflows:{" "}
                  {(
                    (data.operating.inflows /
                      (data.operating.inflows + data.operating.outflows)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
                <span>
                  Outflows:{" "}
                  {(
                    (data.operating.outflows /
                      (data.operating.inflows + data.operating.outflows)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Based on cleared transactions. Pending transactions excluded.
        </p>
      </div>
    </div>
  );
}
