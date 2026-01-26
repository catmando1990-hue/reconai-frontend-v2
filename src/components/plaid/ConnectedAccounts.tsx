"use client";

import { useEffect, useState } from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type ItemStatus = "active" | "login_required" | "error" | string;

type Item = {
  item_id: string;
  institution_id?: string;
  institution_name?: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
};

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
  const [noItemsYet, setNoItemsYet] = useState(false);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    itemId: string;
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    auditedFetch<{
      ok?: boolean;
      items?: Item[];
      status?: string;
      code?: string;
      message?: string;
      request_id: string;
    }>("/api/plaid/items")
      .then((j) => {
        if (!mounted) return;
        if (j.status === "not_connected" || (j.items && j.items.length === 0)) {
          setNoItemsYet(true);
          setItems([]);
        } else {
          setItems(j.items || []);
        }
      })
      .catch((e: unknown) => {
        if (!mounted) return;

        if (e instanceof HttpError && e.status === 400) {
          try {
            const body = e.body as
              | { code?: string; message?: string }
              | undefined;
            if (body?.code === "NO_PLAID_ITEM") {
              setNoItemsYet(true);
              setItems([]);
              return;
            }
          } catch {
            // Fall through
          }
        }

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

  async function handleSync(itemId: string) {
    setSyncingItemId(itemId);
    setSyncResult(null);

    try {
      const data = await auditedFetch<{
        added?: number;
        modified?: number;
        removed?: number;
        request_id: string;
      }>("/api/plaid/sync", {
        method: "POST",
        body: JSON.stringify({ item_id: itemId }),
        skipBodyValidation: true,
      });

      setSyncResult({
        itemId,
        success: true,
        message: `Synced: ${data.added || 0} added, ${data.modified || 0} modified, ${data.removed || 0} removed`,
      });
    } catch (err) {
      let message = "Sync failed";
      if (err instanceof HttpError) {
        const body = err.body as { error?: string } | undefined;
        message = body?.error || `Sync failed (${err.status})`;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setSyncResult({
        itemId,
        success: false,
        message,
      });
    } finally {
      setSyncingItemId(null);
    }
  }

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
          {noItemsYet
            ? "No bank connected yet. Use the button above to link your bank."
            : "No connected accounts yet."}
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
                  Institution
                </th>
                <th className="whitespace-nowrap py-2 pr-4 font-medium">
                  Status
                </th>
                <th className="whitespace-nowrap py-2 pr-4 font-medium">
                  Connected
                </th>
                <th className="whitespace-nowrap py-2 pr-4 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.item_id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4">
                    {it.institution_name || "Unknown Institution"}
                  </td>
                  <td className={`py-2 pr-4 ${getStatusColorClass(it.status)}`}>
                    {getStatusLabel(it.status)}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4">
                    {new Date(it.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4">
                    <button
                      onClick={() => handleSync(it.item_id)}
                      disabled={syncingItemId === it.item_id}
                      className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {syncingItemId === it.item_id ? "Syncing..." : "Sync Now"}
                    </button>
                    {syncResult && syncResult.itemId === it.item_id && (
                      <span
                        className={`ml-2 text-xs ${syncResult.success ? "text-green-600" : "text-red-600"}`}
                      >
                        {syncResult.message}
                      </span>
                    )}
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
