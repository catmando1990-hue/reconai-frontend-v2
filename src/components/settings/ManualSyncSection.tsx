"use client";

import { useState } from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";
import { AuditEvidence } from "@/components/audit/AuditEvidence";

type SyncState = "idle" | "syncing" | "success" | "error";

interface SyncResponse {
  request_id: string;
  last_sync?: string;
  error?: string;
}

interface ManualSyncSectionProps {
  itemId?: string | null;
}

export function ManualSyncSection({ itemId }: ManualSyncSectionProps) {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Audit evidence state
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncState("syncing");
    setErrorMessage(null);
    setLastRequestId(null);

    if (!itemId) {
      setErrorMessage("No bank account connected. Please link a bank account first.");
      setSyncState("error");
      return;
    }

    try {
      const data = await auditedFetch<SyncResponse>("/api/plaid/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ item_id: itemId }),
      });

      // Capture request_id for audit evidence
      setLastRequestId(data.request_id);
      setLastSync(data.last_sync ?? new Date().toISOString());
      setSyncState("success");
    } catch (e: unknown) {
      let message = "Sync failed. Please try again.";
      if (e instanceof AuditProvenanceError) {
        message = `Provenance error: ${e.message}`;
      } else if (e instanceof HttpError) {
        message = `HTTP ${e.status}: ${e.message}`;
      } else if (e instanceof Error) {
        message = e.message;
      }
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
          <>
            <p>
              Last sync completed at {lastSync}. New transactions may still be
              processing.
            </p>
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
