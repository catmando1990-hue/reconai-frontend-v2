"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";

/**
 * Document state for Live State section
 * Documents waiting = status not in ['completed', 'failed']
 */
interface Document {
  id: string;
  filename: string;
  status: "uploaded" | "validated" | "processing" | "completed" | "failed";
  created_at: string;
}

interface DocumentsResponse {
  documents: Document[];
  count: number;
}

/**
 * Plaid status for Live State section (bank items stale)
 */
interface PlaidStatus {
  status: "active" | "login_required" | "error" | "unknown" | "not_connected";
  items_count: number | null;
  last_synced_at: string | null;
  has_items: boolean;
}

/**
 * Signal for Evidence section
 */
interface Signal {
  id: string;
  type: string;
  severity?: "low" | "medium" | "high";
  message?: string;
  confidence?: number;
  created_at?: string;
}

/**
 * Dashboard State - unified state for state-of-business dashboard
 *
 * CANONICAL LAWS:
 * - null means unknown/unavailable (fail-closed)
 * - Empty array means verified empty (no items)
 * - Only display sections with backing data
 */
export interface DashboardState {
  /** P0 GUARD: Overall availability flag - must check before accessing nested data */
  available: boolean;

  /** Live State: Documents waiting for processing */
  documentsWaiting: {
    available: boolean;
    count: number | null;
    items: Document[];
  };

  /** Live State: Bank sync status */
  bankSync: {
    available: boolean;
    status: PlaidStatus["status"] | null;
    isStale: boolean;
    lastSyncedAt: string | null;
    itemsCount: number | null;
  };

  /** Evidence: Signals/anomalies detected */
  signals: {
    available: boolean;
    count: number | null;
    items: Signal[];
    requiresManualFetch: boolean;
  };

  /** Timestamps for evidence section */
  lastUpdated: string | null;
}

const STALE_THRESHOLD_HOURS = 24;

/**
 * Check if a sync timestamp is stale (>24 hours old)
 */
function isSyncStale(lastSyncedAt: string | null): boolean {
  if (!lastSyncedAt) return false; // Unknown is not stale, it's unknown
  try {
    const syncDate = new Date(lastSyncedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff > STALE_THRESHOLD_HOURS;
  } catch {
    return false;
  }
}

/**
 * Filter documents to those waiting for processing
 * Waiting = not completed and not failed
 */
function filterWaitingDocuments(documents: Document[]): Document[] {
  return documents.filter(
    (doc) => doc.status !== "completed" && doc.status !== "failed",
  );
}

/**
 * FAIL-CLOSED: Default state when data is unavailable
 */
const failClosedState: DashboardState = {
  available: false,
  documentsWaiting: {
    available: false,
    count: null,
    items: [],
  },
  bankSync: {
    available: false,
    status: null,
    isStale: false,
    lastSyncedAt: null,
    itemsCount: null,
  },
  signals: {
    available: false,
    count: null,
    items: [],
    requiresManualFetch: true,
  },
  lastUpdated: null,
};

/**
 * useDashboardState - Unified hook for state-of-business dashboard
 *
 * Fetches:
 * - Documents (for "waiting" count)
 * - Plaid status (for bank sync staleness)
 * - Does NOT auto-fetch signals (manual only per LAWS)
 *
 * P0 FIX: Auth Propagation
 * - Uses useApi() hook for org context and auth headers
 * - Gates fetch behind isLoaded to prevent 401 errors
 */
export function useDashboardState() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [state, setState] = useState<DashboardState>(failClosedState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch documents and plaid status in parallel
      const [documentsResult, plaidResult] = await Promise.allSettled([
        apiFetch<DocumentsResponse>("/api/documents"),
        apiFetch<PlaidStatus>("/api/plaid/status"),
      ]);

      // Process documents
      let documentsWaiting: DashboardState["documentsWaiting"] = {
        available: false,
        count: null,
        items: [],
      };

      if (documentsResult.status === "fulfilled" && documentsResult.value) {
        const allDocs = documentsResult.value.documents || [];
        const waitingDocs = filterWaitingDocuments(allDocs);
        documentsWaiting = {
          available: true,
          count: waitingDocs.length,
          items: waitingDocs,
        };
      }

      // Process plaid status
      let bankSync: DashboardState["bankSync"] = {
        available: false,
        status: null,
        isStale: false,
        lastSyncedAt: null,
        itemsCount: null,
      };

      if (plaidResult.status === "fulfilled" && plaidResult.value) {
        const plaid = plaidResult.value;
        // Only mark available if we got a real status (not just "unknown" from fail-closed)
        const hasRealStatus =
          plaid.status !== "unknown" || plaid.items_count !== null;
        bankSync = {
          available: hasRealStatus,
          status: plaid.status,
          isStale: isSyncStale(plaid.last_synced_at),
          lastSyncedAt: plaid.last_synced_at,
          itemsCount: plaid.items_count,
        };
      }

      // Determine overall availability
      const available = documentsWaiting.available || bankSync.available;

      setState({
        available,
        documentsWaiting,
        bankSync,
        signals: {
          available: false,
          count: null,
          items: [],
          requiresManualFetch: true,
        },
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to load dashboard state"),
      );
      setState(failClosedState);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    if (!authReady) {
      return;
    }

    let alive = true;

    const doFetch = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch documents and plaid status in parallel
        const [documentsResult, plaidResult] = await Promise.allSettled([
          apiFetch<DocumentsResponse>("/api/documents"),
          apiFetch<PlaidStatus>("/api/plaid/status"),
        ]);

        if (!alive) return;

        // Process documents
        let documentsWaiting: DashboardState["documentsWaiting"] = {
          available: false,
          count: null,
          items: [],
        };

        if (documentsResult.status === "fulfilled" && documentsResult.value) {
          const allDocs = documentsResult.value.documents || [];
          const waitingDocs = filterWaitingDocuments(allDocs);
          documentsWaiting = {
            available: true,
            count: waitingDocs.length,
            items: waitingDocs,
          };
        }

        // Process plaid status
        let bankSync: DashboardState["bankSync"] = {
          available: false,
          status: null,
          isStale: false,
          lastSyncedAt: null,
          itemsCount: null,
        };

        if (plaidResult.status === "fulfilled" && plaidResult.value) {
          const plaid = plaidResult.value;
          // Only mark available if we got a real status (not just "unknown" from fail-closed)
          const hasRealStatus =
            plaid.status !== "unknown" || plaid.items_count !== null;
          bankSync = {
            available: hasRealStatus,
            status: plaid.status,
            isStale: isSyncStale(plaid.last_synced_at),
            lastSyncedAt: plaid.last_synced_at,
            itemsCount: plaid.items_count,
          };
        }

        // Determine overall availability
        const available = documentsWaiting.available || bankSync.available;

        setState({
          available,
          documentsWaiting,
          bankSync,
          signals: {
            available: false,
            count: null,
            items: [],
            requiresManualFetch: true,
          },
          lastUpdated: new Date().toISOString(),
        });
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to load dashboard state"),
          );
          setState(failClosedState);
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void doFetch();
    return () => {
      alive = false;
    };
  }, [authReady, apiFetch]);

  return useMemo(
    () => ({ state, isLoading, error, refetch: fetchState }),
    [state, isLoading, error, fetchState],
  );
}
