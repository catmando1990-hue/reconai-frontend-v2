"use client";

import { useState, useEffect } from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";
import { AuditEvidence } from "@/components/audit/AuditEvidence";

type SyncState = "idle" | "syncing" | "success" | "error";

interface SyncResponse {
  request_id: string;
  ok?: boolean;
  added?: number;
  modified?: number;
  removed?: number;
  last_sync?: string;
  error?: string;
}

interface Item {
  item_id: string;
  institution_name?: string;
}

interface ItemsResponse {
  items?: Item[];
  request_id: string;
}

/**
 * ManualSyncSection
 *
 * FIX: The original version called /api/plaid/sync without an item_id,
 * which always fails with "Missing item_id".
 *
 * This version:
 * 1. First fetches the list of connected items
 * 2. Syncs each item individually
 * 3. Reports combined results
 */
export function ManualSyncSection() {
  const [items, setItems] = useState<Item[]>([]);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [syncDetails, setSyncDetails] = useState<string | null>(null);

  // Fetch connected items on mount
  useEffect(() => {
    async function fetchItems() {
      try {
        const data = await auditedFetch<ItemsResponse>("/api/plaid/items");
        setItems(data.items ?? []);
      } catch {
        // Silently fail - we'll show "No bank connected" message
        setItems([]);
      }
    }
    fetchItems();
  }, []);

  const handleSync = async () => {
    if (items.length === 0) {
      setErrorMessage(
        "No bank accounts connected. Please connect a bank first.",
      );
      setSyncState("error");
      return;
    }

    setSyncState("syncing");
    setErrorMessage(null);
    setLastRequestId(null);
    setSyncDetails(null);

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;
    let lastReqId: string | null = null;
    let hasError = false;
    const errors: string[] = [];

    // Sync each item
    for (const item of items) {
      try {
        const data = await auditedFetch<SyncResponse>("/api/plaid/sync", {
          method: "POST",
          body: JSON.stringify({ item_id: item.item_id }),
        });

        lastReqId = data.request_id;
        totalAdded += data.added ?? 0;
        totalModified += data.modified ?? 0;
        totalRemoved += data.removed ?? 0;
      } catch (e: unknown) {
        hasError = true;
        let message = `${item.institution_name || "Bank"}: Sync failed`;
        if (e instanceof AuditProvenanceError) {
          message = `${item.institution_name || "Bank"}: Provenance error`;
        } else if (e instanceof HttpError) {
          message = `${item.institution_name || "Bank"}: HTTP ${e.status}`;
        }
        errors.push(message);
      }
    }

    setLastRequestId(lastReqId);

    if (hasError && totalAdded === 0 && totalModified === 0) {
      // Complete failure
      setErrorMessage(errors.join(". "));
      setSyncState("error");
    } else {
      // At least partial success
      setLastSync(new Date().toISOString());
      setSyncDetails(
        `${totalAdded} added, ${totalModified} modified, ${totalRemoved} removed`,
      );
      setSyncState("success");
      if (errors.length > 0) {
        // Partial failure - still show success but note the errors
        setErrorMessage(`Some accounts had issues: ${errors.join(". ")}`);
      }
    }
  };

  const disabled = syncState === "syncing";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={disabled || items.length === 0}
        className="w-full inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {syncState === "syncing"
          ? "Syncing..."
          : items.length === 0
            ? "No banks connected"
            : `Sync ${items.length} account${items.length > 1 ? "s" : ""}`}
      </button>

      <div className="text-xs text-muted-foreground">
        {syncState === "idle" && !lastSync && items.length > 0 && (
          <p>
            Ready to sync {items.length} connected account
            {items.length > 1 ? "s" : ""}.
          </p>
        )}
        {syncState === "idle" && items.length === 0 && (
          <p>No banks connected. Use &quot;Link Bank Account&quot; above.</p>
        )}
        {syncState === "syncing" && (
          <p>Sync in progress. This may take a few moments.</p>
        )}
        {syncState === "success" && (
          <>
            <p>Sync completed: {syncDetails}</p>
            {errorMessage && (
              <p className="text-amber-600 dark:text-amber-400 mt-1">
                {errorMessage}
              </p>
            )}
            <AuditEvidence requestId={lastRequestId} variant="success" />
          </>
        )}
        {syncState === "error" && (
          <>
            <p className="text-destructive">
              {errorMessage || "Sync failed. Please try again."}
            </p>
            <AuditEvidence requestId={lastRequestId} variant="error" />
          </>
        )}
      </div>
    </div>
  );
}
