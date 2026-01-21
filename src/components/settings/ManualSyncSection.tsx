"use client";

import { useState } from "react";

type SyncState = "idle" | "syncing" | "success" | "error";

interface SyncResponse {
  last_sync?: string;
  error?: string;
}

export function ManualSyncSection() {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncState("syncing");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        const msg =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.detail === "string"
              ? data.detail
              : "Sync failed. Please try again.";
        throw new Error(msg);
      }

      const data = (await res.json().catch(() => ({}))) as SyncResponse;
      setLastSync(data.last_sync ?? new Date().toISOString());
      setSyncState("success");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Sync failed. Please try again.";
      setErrorMessage(message);
      setSyncState("error");
    }
  };

  const disabled = syncState === "syncing";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={disabled}
        className="w-full inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {syncState === "syncing" ? "Syncing..." : "Sync transactions"}
      </button>

      <div className="text-xs text-muted-foreground">
        {syncState === "idle" && !lastSync && <p>No sync has been run yet.</p>}
        {syncState === "syncing" && (
          <p>Sync in progress. This may take a few moments.</p>
        )}
        {syncState === "success" && lastSync && (
          <p>
            Last sync completed at {lastSync}. New transactions may still be
            processing.
          </p>
        )}
        {syncState === "error" && (
          <p className="text-destructive">
            {errorMessage || "Sync failed. Please try again."}
          </p>
        )}
      </div>
    </div>
  );
}
