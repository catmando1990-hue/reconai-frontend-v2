"use client";

import { useEffect, useMemo, useState } from "react";

type Account = {
  item_id: string;
  account_id: string;
  institution_name: string | null;
  name: string | null;
  official_name: string | null;
  type: string | null;
  subtype: string | null;
  mask: string | null;
  balance_current: number | null;
  balance_available: number | null;
  iso_currency_code: string | null;
};

function fmtMoney(v: number | null, ccy: string | null) {
  if (v === null || v === undefined) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: ccy || "USD",
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return String(v);
  }
}

async function fetchAccounts() {
  const r = await fetch("/api/plaid/accounts");
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Failed to load accounts");
  return (j.accounts || []) as Account[];
}

export function AccountsPanel() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchAccounts()
      .then((a) => {
        if (!mounted) return;
        setAccounts(a);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load accounts");
        setAccounts([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const a of accounts || []) {
      const key = a.institution_name || "Institution";
      map.set(key, [...(map.get(key) || []), a]);
    }
    return Array.from(map.entries());
  }, [accounts]);

  return (
    <section className="rounded-2xl border bg-background p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Linked accounts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Balances and connection details pulled from Plaid and stored in
            Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAccounts(null);
            setError(null);
            fetchAccounts()
              .then((a) => setAccounts(a))
              .catch((e: unknown) => {
                setError(e instanceof Error ? e.message : "Failed to refresh");
                setAccounts([]);
              });
          }}
          className="rounded-xl border bg-card/40 px-3 py-2 text-xs"
        >
          Refresh
        </button>
      </div>

      {accounts === null && (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-muted-foreground">Error: {error}</p>
      )}

      {accounts !== null && accounts.length === 0 && !error && (
        <p className="mt-4 text-sm text-muted-foreground">
          No accounts found. Connect a bank first on the Connect Bank page.
        </p>
      )}

      {accounts !== null && accounts.length > 0 && (
        <div className="mt-6 space-y-6">
          {grouped.map(([inst, rows]) => (
            <div key={inst} className="rounded-2xl border bg-card/30">
              <div className="border-b px-4 py-3">
                <div className="text-sm font-semibold">{inst}</div>
                <div className="text-xs text-muted-foreground">
                  {rows.length} account(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-4 py-2 font-medium">Account</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Current</th>
                      <th className="px-4 py-2 font-medium">Available</th>
                      <th className="px-4 py-2 font-medium">Mask</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => (
                      <tr
                        key={a.account_id}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-4 py-2">
                          <div className="font-medium">
                            {a.name || a.official_name || "Account"}
                          </div>
                          {a.official_name &&
                            a.name &&
                            a.official_name !== a.name && (
                              <div className="text-xs text-muted-foreground">
                                {a.official_name}
                              </div>
                            )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-xs">
                            {[a.type, a.subtype].filter(Boolean).join(" / ") ||
                              "—"}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {fmtMoney(a.balance_current, a.iso_currency_code)}
                        </td>
                        <td className="px-4 py-2">
                          {fmtMoney(a.balance_available, a.iso_currency_code)}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {a.mask || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
