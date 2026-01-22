"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";

/**
 * CORE State - Single source of truth for all CORE surfaces
 *
 * P0 FIX: Every CORE UI surface MUST be driven by this single hook.
 * - Fetches ONCE on mount (after auth)
 * - Auto-refetches on org switch
 * - No per-card independent fetches
 * - No manual "Fetch" buttons
 */

// Live State - what needs attention NOW
export interface CoreLiveState {
  unpaid_invoices: {
    count: number;
    total_due: number;
    items: Array<{
      id: string;
      customer_name: string;
      amount_due: number;
      due_date: string | null;
      is_overdue: boolean;
    }>;
  } | null;

  unpaid_bills: {
    count: number;
    total_due: number;
    items: Array<{
      id: string;
      vendor_name: string;
      amount_due: number;
      due_date: string | null;
      is_overdue: boolean;
    }>;
  } | null;

  bank_sync: {
    status: "healthy" | "stale" | "error" | "not_connected";
    last_synced_at: string | null;
    items_needing_attention: number;
  } | null;
}

// Evidence - actual backend data
export interface CoreEvidence {
  invoices: {
    total_count: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    by_status: {
      paid: number;
      pending: number;
      overdue: number;
      draft: number;
    };
  } | null;

  bills: {
    total_count: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    by_status: {
      paid: number;
      pending: number;
      overdue: number;
    };
  } | null;

  customers: {
    total_count: number;
  } | null;

  vendors: {
    total_count: number;
  } | null;

  recent_transactions: {
    count: number;
    items: Array<{
      id: string;
      date: string;
      amount: number;
      merchant_name: string;
    }>;
  } | null;
}

/**
 * SUPPORTED SYNC VERSIONS
 * Frontend will FAIL-CLOSED on unknown or missing versions.
 * Add new versions here when backend contract changes.
 */
export const SUPPORTED_SYNC_VERSIONS = ["1"] as const;
export type SupportedSyncVersion = (typeof SUPPORTED_SYNC_VERSIONS)[number];

/** Sync lifecycle state */
export interface CoreSyncState {
  /** Version of sync contract - REQUIRED for rendering */
  version: string;
  status: "running" | "failed" | "success" | "never";
  started_at: string | null;
  last_successful_at: string | null;
  error_reason: string | null;
}

/**
 * Type guard: Check if sync version is supported
 * FAIL-CLOSED: Unknown versions are rejected
 */
export function isSupportedSyncVersion(
  version: unknown
): version is SupportedSyncVersion {
  return (
    typeof version === "string" &&
    SUPPORTED_SYNC_VERSIONS.includes(version as SupportedSyncVersion)
  );
}

/**
 * Validate sync state has supported version
 * Returns false if version is missing or unknown
 */
export function isValidSyncState(sync: unknown): sync is CoreSyncState {
  if (!sync || typeof sync !== "object") return false;
  const s = sync as Record<string, unknown>;
  return (
    isSupportedSyncVersion(s.version) &&
    typeof s.status === "string" &&
    ["running", "failed", "success", "never"].includes(s.status)
  );
}

// Full CORE state response
export interface CoreState {
  /**
   * MANDATORY CHECK: If false, render NOTHING for CORE widgets.
   * Do not show "--", do not show empty cards, do not show placeholders.
   */
  available: boolean;

  /** Request tracking */
  request_id: string;
  fetched_at: string;

  /** Sync lifecycle - only render UI for "running" or "failed" states */
  sync: CoreSyncState;

  /** Live State - what needs attention NOW */
  live_state: CoreLiveState;

  /** Evidence - actual backend data */
  evidence: CoreEvidence;
}

/**
 * FAIL-CLOSED: Default state when data unavailable or invalid
 * Note: version "1" is used for fail-closed state to pass validation
 * but available=false ensures no data renders
 */
const failClosedState: CoreState = {
  available: false,
  request_id: "",
  fetched_at: "",
  sync: {
    version: "1",
    status: "never",
    started_at: null,
    last_successful_at: null,
    error_reason: null,
  },
  live_state: {
    unpaid_invoices: null,
    unpaid_bills: null,
    bank_sync: null,
  },
  evidence: {
    invoices: null,
    bills: null,
    customers: null,
    vendors: null,
    recent_transactions: null,
  },
};

/**
 * useCoreState - Single fetch hook for all CORE surfaces
 *
 * P0 FIX:
 * - Fetches core_state ONCE on mount
 * - Waits for auth to be ready
 * - Auto-refetches on org switch
 * - No manual triggers required
 *
 * Usage:
 * ```tsx
 * const { state, isLoading } = useCoreState();
 *
 * if (!state.available) {
 *   // Render NOTHING for CORE widgets
 *   return null;
 * }
 *
 * // Render only sections with data
 * ```
 */
export function useCoreState() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady, org_id } = useOrg();

  const [state, setState] = useState<CoreState>(failClosedState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiFetch<CoreState>("/api/core/state");

      // FAIL-CLOSED: Validate response structure AND sync version
      if (
        response &&
        typeof response.available === "boolean" &&
        isValidSyncState(response.sync)
      ) {
        setState(response);
      } else {
        // Unknown or missing sync version = fail-closed
        console.warn(
          "[useCoreState] Invalid response or unsupported sync version, failing closed",
          { syncVersion: response?.sync?.version }
        );
        setState(failClosedState);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch core state"),
      );
      setState(failClosedState);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  // Auto-fetch on mount and org switch
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

        const response = await apiFetch<CoreState>("/api/core/state");

        if (alive) {
          // FAIL-CLOSED: Validate response structure AND sync version
          if (
            response &&
            typeof response.available === "boolean" &&
            isValidSyncState(response.sync)
          ) {
            setState(response);
          } else {
            // Unknown or missing sync version = fail-closed
            console.warn(
              "[useCoreState] Invalid response or unsupported sync version, failing closed",
              { syncVersion: response?.sync?.version }
            );
            setState(failClosedState);
          }
        }
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to fetch core state"),
          );
          setState(failClosedState);
        }
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    };

    void doFetch();

    return () => {
      alive = false;
    };
  }, [authReady, org_id, apiFetch]); // Re-fetch on org change

  // Derived state helpers
  const derived = useMemo(() => {
    const { live_state, evidence, sync } = state;

    // Has any attention items?
    const hasAttentionItems =
      (live_state.unpaid_invoices?.count ?? 0) > 0 ||
      (live_state.unpaid_bills?.count ?? 0) > 0 ||
      live_state.bank_sync?.status === "error" ||
      live_state.bank_sync?.status === "stale";

    // Has any evidence?
    const hasEvidence =
      evidence.invoices !== null ||
      evidence.bills !== null ||
      evidence.customers !== null ||
      evidence.vendors !== null;

    // Total due across invoices and bills
    const totalDue =
      (live_state.unpaid_invoices?.total_due ?? 0) +
      (live_state.unpaid_bills?.total_due ?? 0);

    // Overdue counts
    const overdueInvoices =
      live_state.unpaid_invoices?.items.filter((i) => i.is_overdue).length ?? 0;
    const overdueBills =
      live_state.unpaid_bills?.items.filter((b) => b.is_overdue).length ?? 0;

    // Sync state helpers - only render UI for running/failed
    const isSyncing = sync.status === "running";
    const hasSyncError = sync.status === "failed";

    return {
      hasAttentionItems,
      hasEvidence,
      totalDue,
      overdueInvoices,
      overdueBills,
      isSyncing,
      hasSyncError,
    };
  }, [state]);

  return useMemo(
    () => ({
      state,
      isLoading,
      error,
      refetch: fetchState,
      ...derived,
    }),
    [state, isLoading, error, fetchState, derived],
  );
}
