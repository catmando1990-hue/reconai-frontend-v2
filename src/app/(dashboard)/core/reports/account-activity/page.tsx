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
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
        <div>
          <label className="block text-xs text-[#6b7280] dark:text-[#a1a1aa] mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => updateParams({ start_date: e.target.value })}
            className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#6b7280] dark:text-[#a1a1aa] mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => updateParams({ end_date: e.target.value })}
            className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb]"
          />
        </div>
        <button
          type="button"
          onClick={() => updateParams({ start_date: null, end_date: null })}
          className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
        >
          Clear Filters
        </button>
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={accounts.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] px-3 py-1.5 text-sm text-[#111827] dark:text-[#f9fafb] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      {!loading && summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
            <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">Accounts</div>
            <div className="mt-1 text-2xl font-semibold text-[#111827] dark:text-[#f9fafb]">
              {summary.total_accounts}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
            <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">Total Balance</div>
            <div className="mt-1 text-2xl font-semibold text-[#111827] dark:text-[#f9fafb]">
              {formatCurrency(summary.total_current_balance)}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
            <div className="flex items-center gap-1 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
              <TrendingUp className="h-3 w-3 text-[#059669] dark:text-[#10b981]" />
              Inflows
            </div>
            <div className="mt-1 text-2xl font-semibold text-[#059669] dark:text-[#10b981]">
              {formatCurrency(summary.total_inflows)}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
            <div className="flex items-center gap-1 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
              <TrendingDown className="h-3 w-3 text-[#dc2626] dark:text-[#ef4444]" />
              Outflows
            </div>
            <div className="mt-1 text-2xl font-semibold text-[#dc2626] dark:text-[#ef4444]">
              {formatCurrency(summary.total_outflows)}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white/50 dark:bg-[#18181b]/50 p-4">
            <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">Net Change</div>
            <div
              className={`mt-1 text-2xl font-semibold ${summary.net_change >= 0 ? "text-[#059669] dark:text-[#10b981]" : "text-[#dc2626] dark:text-[#ef4444]"}`}
            >
              {formatCurrency(summary.net_change)}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-[#dc2626]/50 dark:border-[#ef4444]/50 bg-[#dc2626]/10 dark:bg-[#ef4444]/10 p-4 text-sm text-[#dc2626] dark:text-[#ef4444]">
          {error}
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-[#f9fafb] dark:bg-[#27272a]" />
          ))
        ) : accounts.length === 0 ? (
          <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-12 text-center text-[#6b7280] dark:text-[#a1a1aa]">
            No accounts found
          </div>
        ) : (
          accounts.map((acct) => (
            <div
              key={acct.account_id}
              className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b]"
            >
              <div className="flex items-start justify-between border-b border-[#e5e7eb] dark:border-[#27272a] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#27272a] p-2">
                    <Building2 className="h-5 w-5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#111827] dark:text-[#f9fafb]">{acct.name}</div>
                    <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                      {acct.institution_name || "Bank"} •••• {acct.mask} •{" "}
                      {acct.type}
                      {acct.subtype && ` / ${acct.subtype}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                    Current Balance
                  </div>
                  <div className="text-xl font-semibold text-[#111827] dark:text-[#f9fafb]">
                    {formatCurrency(acct.current_balance)}
                  </div>
                  {acct.available_balance !== null &&
                    acct.available_balance !== acct.current_balance && (
                      <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                        {formatCurrency(acct.available_balance)} available
                      </div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-4 divide-x divide-[#e5e7eb] dark:divide-[#27272a]">
                <div className="p-4 text-center">
                  <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">Inflows</div>
                  <div className="mt-1 font-semibold text-[#059669] dark:text-[#10b981]">
                    {formatCurrency(acct.inflows)}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">Outflows</div>
                  <div className="mt-1 font-semibold text-[#dc2626] dark:text-[#ef4444]">
                    {formatCurrency(acct.outflows)}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                    Net Change
                  </div>
                  <div
                    className={`mt-1 font-semibold ${acct.net_change >= 0 ? "text-[#059669] dark:text-[#10b981]" : "text-[#dc2626] dark:text-[#ef4444]"}`}
                  >
                    {formatCurrency(acct.net_change)}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                    Transactions
                  </div>
                  <div className="mt-1 font-semibold text-[#111827] dark:text-[#f9fafb]">
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
