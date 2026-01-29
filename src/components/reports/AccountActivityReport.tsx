"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Download, RefreshCw, Wallet } from "lucide-react";

type DailyActivity = {
  date: string;
  balance: number;
  inflows: number;
  outflows: number;
};

type AccountData = {
  account_id: string;
  account_name: string;
  account_type: string;
  institution_name: string;
  current_balance: number;
  total_inflows: number;
  total_outflows: number;
  net_change: number;
  transaction_count: number;
  daily_activity: DailyActivity[];
};

type AccountActivitySummary = {
  total_balance: number;
  total_inflows: number;
  total_outflows: number;
  net_change: number;
  account_count: number;
};

type AccountActivityData = {
  start_date: string;
  end_date: string;
  accounts: AccountData[];
  summary: AccountActivitySummary;
};

type AccountActivityResponse = {
  data: AccountActivityData;
  request_id: string;
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

function AwaitingDataState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Wallet className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Awaiting Data
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Account activity summary will appear here once bank accounts are
        connected. Connect a bank account to start tracking per-account
        transactions.
      </p>
    </div>
  );
}

export function AccountActivityReport() {
  const { apiFetch } = useApi();
  const { isLoaded } = useOrg();

  const [data, setData] = useState<AccountActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"30" | "60" | "90">("30");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<AccountActivityResponse>(
        `/api/reports/account-activity?days=${period}`,
      );
      // Handle both response formats
      const reportData =
        response?.data ?? (response as unknown as AccountActivityData);
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
    if (!data || data.accounts.length === 0) return;

    const headers = [
      "Account",
      "Type",
      "Institution",
      "Current Balance",
      "Inflows",
      "Outflows",
      "Net Change",
      "Transaction Count",
    ];
    const rows = data.accounts.map((acc) => [
      `"${acc.account_name}"`,
      acc.account_type,
      `"${acc.institution_name}"`,
      acc.current_balance.toFixed(2),
      acc.total_inflows.toFixed(2),
      acc.total_outflows.toFixed(2),
      acc.net_change.toFixed(2),
      acc.transaction_count.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `account-activity-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = data && data.accounts.length > 0;

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Account Activity Report</h3>
          <p className="text-xs text-muted-foreground">
            Per-account transaction summaries
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
        <>
          {/* Totals Summary */}
          <div className="grid grid-cols-4 gap-4 border-b bg-muted/20 px-4 py-3">
            <div>
              <div className="text-xs text-muted-foreground">Total Inflows</div>
              <div className="font-mono text-sm font-semibold text-emerald-600">
                +{formatCurrency(data.summary.total_inflows)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Total Outflows
              </div>
              <div className="font-mono text-sm font-semibold text-destructive">
                -{formatCurrency(data.summary.total_outflows)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net Change</div>
              <div
                className={[
                  "font-mono text-sm font-semibold",
                  data.summary.net_change >= 0
                    ? "text-emerald-600"
                    : "text-destructive",
                ].join(" ")}
              >
                {data.summary.net_change >= 0 ? "+" : "-"}
                {formatCurrency(data.summary.net_change)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Balance</div>
              <div className="text-sm font-semibold">
                {formatCurrency(data.summary.total_balance)}
              </div>
            </div>
          </div>

          {/* Period Info */}
          {data.start_date && data.end_date && (
            <div className="px-4 py-2 bg-muted/10 text-xs text-muted-foreground">
              {formatDate(data.start_date)} – {formatDate(data.end_date)} •{" "}
              {data.summary.account_count} account
              {data.summary.account_count !== 1 ? "s" : ""}
            </div>
          )}

          {/* Account List */}
          <div className="divide-y">
            {data.accounts.map((acc) => (
              <div key={acc.account_id} className="px-4 py-4 hover:bg-muted/20">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate">
                        {acc.account_name}
                      </div>
                      <div
                        className={[
                          "font-mono text-sm font-semibold",
                          acc.net_change >= 0
                            ? "text-emerald-600"
                            : "text-destructive",
                        ].join(" ")}
                      >
                        {acc.net_change >= 0 ? "+" : "-"}
                        {formatCurrency(acc.net_change)}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-0.5">
                      {acc.institution_name} • {acc.account_type}
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground">Balance</div>
                        <div className="font-mono">
                          {formatCurrency(acc.current_balance)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Inflows</div>
                        <div className="font-mono text-emerald-600">
                          +{formatCurrency(acc.total_inflows)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Outflows</div>
                        <div className="font-mono text-destructive">
                          -{formatCurrency(acc.total_outflows)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Transactions
                        </div>
                        <div>{acc.transaction_count}</div>
                      </div>
                    </div>

                    {/* Activity bar */}
                    {(acc.total_inflows > 0 || acc.total_outflows > 0) && (
                      <div className="mt-2 flex h-1.5 rounded-full overflow-hidden bg-muted">
                        <div
                          className="bg-emerald-500"
                          style={{
                            width: `${
                              (acc.total_inflows /
                                (acc.total_inflows + acc.total_outflows)) *
                              100
                            }%`,
                          }}
                        />
                        <div
                          className="bg-destructive"
                          style={{
                            width: `${
                              (acc.total_outflows /
                                (acc.total_inflows + acc.total_outflows)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Note */}
      <div className="border-t bg-muted/20 px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Account balances and activity are updated periodically from connected
          bank accounts.
        </p>
      </div>
    </div>
  );
}
