"use client";

import { useEffect, useState } from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

/**
 * P1 FIX: Item status is now based on actual backend values.
 * Status values match the PlaidItemStatus enum from backend.
 */
type ItemStatus = "active" | "login_required" | "error" | string;

type Item = {
  item_id: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
};

/**
 * P1 FIX: Get human-readable status label with honest representation.
 */
function getStatusLabel(status: ItemStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "login_required":
      return "Needs Re-auth";
    case "error":
      return "Error";
    default:
      return status || "Unknown";
  }
}

/**
 * P1 FIX: Get status color class for visual indication.
 */
function getStatusColorClass(status: ItemStatus): string {
  switch (status) {
    case "active":
      return "text-green-600 dark:text-green-400";
    case "login_required":
      return "text-amber-600 dark:text-amber-400";
    case "error":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}

export function ConnectedAccounts() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    auditedFetch<{ items: Item[]; request_id: string }>("/api/plaid/items")
      .then((j) => {
        if (!mounted) return;
        setItems(j.items || []);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        let message = "Failed to load";
        if (e instanceof AuditProvenanceError) {
          message = `Provenance error: ${e.message}`;
        } else if (e instanceof HttpError) {
          message = `HTTP ${e.status}: ${e.message}`;
        } else if (e instanceof Error) {
          message = e.message;
        }
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
                  <td className={`py-2 pr-4 ${getStatusColorClass(it.status)}`}>
                    {getStatusLabel(it.status)}
                  </td>
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
