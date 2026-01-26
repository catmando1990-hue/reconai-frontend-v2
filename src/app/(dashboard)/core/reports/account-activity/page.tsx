"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { Download, Building2, TrendingUp, TrendingDown } from "lucide-react";
import { auditedFetch } from "@/lib/auditedFetch";

type AccountActivity = {
  account_id: string;
  name: string;
  type: string;
  subtype: string | null;
  mask: string | null;
  institution_name: string | null;
  current_balance: number | null;
  available_balance: number | null;
  inflows: number;
  outflows: number;
  net_change: number;
  transaction_count: number;
};

type Summary = {
  total_accounts: number;
  total_current_balance: number;
  total_inflows: number;
  total_outflows: number;
  net_change: number;
};

function formatCurrency(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function AccountActivityReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<AccountActivity[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startDate = searchParams.get("start_date") || "";
  const endDate = searchParams.get("end_date") || "";

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const data = await auditedFetch<{
        ok: boolean;
        data?: AccountActivity[];
        summary?: Summary;
        error?: { message?: string };
        request_id: string;
      }>(`/api/reports/account-activity?${params.toString()}`, {
        skipBodyValidation: true,
      });

      if (!data.ok) {
        throw new Error(data.error?.message || "Failed to load report");
      }

      setAccounts(data.data || []);
      setSummary(data.summary || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`/core/reports/account-activity?${params.toString()}`);
  };

  const handleExportCSV = () => {
    if (accounts.length === 0) return;

    const headers = [
      "Account",
      "Institution",
      "Type",
      "Mask",
      "Current Balance",
      "Inflows",
      "Outflows",
      "Net Change",
      "Transactions",
    ];
    const csvRows = accounts.map((a) => [
      a.name,
      a.institution_name || "",
      a.type,
      a.mask || "",
      a.current_balance || 0,
      a.inflows,
      a.outflows,
      a.net_change,
      a.transaction_count,
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `account-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RouteShell
      title="Account Activity"
      subtitle="Per-account transaction summaries with balances"
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card/50 p-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => updateParams({ start_date: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => updateParams({ end_date: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => updateParams({ start_date: null, end_date: null })}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
        >
          Clear Filters
        </button>
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={accounts.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      {!loading && summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Accounts</div>
            <div className="mt-1 text-2xl font-semibold">
              {summary.total_accounts}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Total Balance</div>
            <div className="mt-1 text-2xl font-semibold">
              {formatCurrency(summary.total_current_balance)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              Inflows
            </div>
            <div className="mt-1 text-2xl font-semibold text-green-600">
              {formatCurrency(summary.total_inflows)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-600" />
              Outflows
            </div>
            <div className="mt-1 text-2xl font-semibold text-red-600">
              {formatCurrency(summary.total_outflows)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="text-xs text-muted-foreground">Net Change</div>
            <div
              className={`mt-1 text-2xl font-semibold ${summary.net_change >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(summary.net_change)}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            No accounts found
          </div>
        ) : (
          accounts.map((acct) => (
            <div
              key={acct.account_id}
              className="rounded-xl border border-border bg-card"
            >
              <div className="flex items-start justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-border bg-muted p-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{acct.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {acct.institution_name || "Bank"} •••• {acct.mask} •{" "}
                      {acct.type}
                      {acct.subtype && ` / ${acct.subtype}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    Current Balance
                  </div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(acct.current_balance)}
                  </div>
                  {acct.available_balance !== null &&
                    acct.available_balance !== acct.current_balance && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(acct.available_balance)} available
                      </div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-4 divide-x divide-border">
                <div className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">Inflows</div>
                  <div className="mt-1 font-semibold text-green-600">
                    {formatCurrency(acct.inflows)}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">Outflows</div>
                  <div className="mt-1 font-semibold text-red-600">
                    {formatCurrency(acct.outflows)}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">
                    Net Change
                  </div>
                  <div
                    className={`mt-1 font-semibold ${acct.net_change >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(acct.net_change)}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-xs text-muted-foreground">
                    Transactions
                  </div>
                  <div className="mt-1 font-semibold">
                    {acct.transaction_count}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </RouteShell>
  );
}
