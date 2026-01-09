"use client";

import { useEffect, useState } from "react";

type Item = {
  item_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function ConnectedAccounts() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/plaid/items")
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || "Failed to load");
        return j;
      })
      .then((j) => {
        if (!mounted) return;
        setItems(j.items || []);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        const message = e instanceof Error ? e.message : "Failed to load";
        setError(message);
        setItems([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border bg-background p-6">
      <h2 className="text-lg font-semibold tracking-tight">
        Connected accounts
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        These are the bank connections currently linked to your ReconAI account.
      </p>

      {items === null && (
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      )}

      {items !== null && items.length === 0 && !error && (
        <p className="mt-4 text-sm text-muted-foreground">
          No connected accounts yet.
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-muted-foreground">Error: {error}</p>
      )}

      {items !== null && items.length > 0 && (
        <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-80 text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="whitespace-nowrap py-2 pr-4 font-medium">
                  Item ID
                </th>
                <th className="whitespace-nowrap py-2 pr-4 font-medium">
                  Status
                </th>
                <th className="whitespace-nowrap py-2 pr-4 font-medium">
                  Connected
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.item_id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 font-mono text-xs">{it.item_id}</td>
                  <td className="py-2 pr-4">{it.status}</td>
                  <td className="whitespace-nowrap py-2 pr-4">
                    {new Date(it.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
