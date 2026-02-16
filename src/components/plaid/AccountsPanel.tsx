"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { HttpError } from "@/lib/auditedFetch";
import { Trash2 } from "lucide-react";

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

export function AccountsPanel() {
  const { auditedFetch } = useApi();
  const { org_id, isLoaded: orgLoaded } = useOrg();

  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noItemsYet, setNoItemsYet] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // Org readiness gate - fail-closed
  const orgReady = orgLoaded && !!org_id;

  // Fetch accounts using org-scoped API
  const fetchAccountsData = useCallback(async () => {
    if (!orgReady) return [];

    const j = await auditedFetch<{
      accounts: Account[];
      request_id: string;
    }>("/api/plaid/accounts");
    return j.accounts || [];
  }, [auditedFetch, orgReady]);

  // Remove item using org-scoped API
  const removeItem = useCallback(
    async (itemId: string) => {
      if (!orgReady) return;

      const j = await auditedFetch<{
        ok: boolean;
        success?: boolean;
        message?: string;
        request_id: string;
      }>(`/api/plaid/items/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      });
      if (!j.ok && !j.success) {
        throw new Error(j.message || "Failed to remove bank connection");
      }
      return j;
    },
    [auditedFetch, orgReady],
  );

  useEffect(() => {
    let mounted = true;
    if (!orgReady) return;

    fetchAccountsData()
      .then((a) => {
        if (!mounted) return;
        setAccounts(a);
      })
      .catch((e: unknown) => {
        if (!mounted) return;

        // Handle NO_PLAID_ITEM gracefully - not an error state
        if (e instanceof HttpError && e.status === 400) {
          try {
            const body = e.body as
              | { code?: string; message?: string }
              | undefined;
            if (body?.code === "NO_PLAID_ITEM") {
              setNoItemsYet(true);
              setAccounts([]);
              return;
            }
          } catch {
            // Fall through to error handling
          }
        }

        setError(e instanceof Error ? e.message : "Failed to load accounts");
        setAccounts([]);
      });
    return () => {
      mounted = false;
    };
  }, [fetchAccountsData, orgReady]);

  const grouped = useMemo(() => {
    const map = new Map<string, { itemId: string; accounts: Account[] }>();
    for (const a of accounts || []) {
      const key = a.institution_name || "Institution";
      const existing = map.get(key);
      if (existing) {
        existing.accounts.push(a);
      } else {
        map.set(key, { itemId: a.item_id, accounts: [a] });
      }
    }
    return Array.from(map.entries());
  }, [accounts]);

  const handleRemoveClick = useCallback(
    async (itemId: string, institutionName: string) => {
      if (!orgReady) return;

      const confirmed = window.confirm(
        `Are you sure you want to remove ${institutionName}?\n\nThis will disconnect all accounts from this bank. This action cannot be undone.`,
      );
      if (!confirmed) return;

      setRemovingItemId(itemId);
      setError(null);

      try {
        await removeItem(itemId);
        // Refresh accounts list
        const refreshed = await fetchAccountsData();
        setAccounts(refreshed);
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Failed to remove bank connection",
        );
      } finally {
        setRemovingItemId(null);
      }
    },
    [fetchAccountsData, orgReady, removeItem],
  );

  // Org readiness gate UI
  if (orgLoaded && !org_id) {
    return (
      <section className="rounded-2xl border bg-background p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Linked accounts
        </h2>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Organization required
          </p>
          <p className="mt-1 text-amber-700 dark:text-amber-300">
            Select an organization to view linked bank accounts.
          </p>
        </div>
      </section>
    );
  }

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
          disabled={!orgReady}
          onClick={() => {
            if (!orgReady) return;
            setAccounts(null);
            setError(null);
            fetchAccountsData()
              .then((a) => setAccounts(a))
              .catch((e: unknown) => {
                setError(e instanceof Error ? e.message : "Failed to refresh");
                setAccounts([]);
              });
          }}
          className="rounded-xl border bg-card/40 px-3 py-2 text-xs disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {(!orgLoaded || accounts === null) && (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      )}

      {error && <p className="mt-4 text-sm text-destructive">Error: {error}</p>}

      {orgReady && accounts !== null && accounts.length === 0 && !error && (
        <p className="mt-4 text-sm text-muted-foreground">
          {noItemsYet
            ? "No bank connected yet. Visit the Connect Bank page to link your bank."
            : "No accounts found. Connect a bank first on the Connect Bank page."}
        </p>
      )}

      {accounts !== null && accounts.length > 0 && (
        <div className="mt-6 space-y-6">
          {grouped.map(([inst, { itemId, accounts: rows }]) => (
            <div key={inst} className="rounded-2xl border bg-card/30">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">{inst}</div>
                  <div className="text-xs text-muted-foreground">
                    {rows.length} account(s)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveClick(itemId, inst)}
                  disabled={removingItemId === itemId}
                  className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/20 disabled:opacity-50"
                  title="Remove this bank connection"
                >
                  {removingItemId === itemId ? (
                    <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                  Remove
                </button>
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
