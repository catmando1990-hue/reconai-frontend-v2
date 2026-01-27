"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useOrg } from "@/lib/org-context";
import { useFinancialEvidence } from "@/lib/financial-evidence-context";
import {
  Wallet,
  RefreshCw,
  AlertCircle,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
  Building2,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

type SnapshotAccount = {
  institution_name: string;
  institution_id: string;
  account_name: string;
  account_mask: string;
  account_type: string;
  balance_as_of: number;
};

type AssetSnapshot = {
  report_id: string;
  generated_at: string;
  total_assets: number;
  accounts: SnapshotAccount[];
};

type ListResponse = {
  ok: boolean;
  reports: AssetSnapshot[];
  error?: string;
  request_id: string;
};

type CreateResponse = {
  ok: boolean;
  report_id?: string;
  generated_at?: string;
  error?: string;
  request_id: string;
};

type RemoveResponse = {
  ok: boolean;
  removed?: boolean;
  error?: string;
  request_id: string;
};

type ActionState = {
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  requestId?: string;
};

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return isoString;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * NetWorthSnapshotPanel — Audit-grade historical asset snapshot viewer
 *
 * Phase 8B Requirements:
 * - RBAC gated: Only visible to admin or org:admin roles
 * - Manual "Load Asset Snapshots" action only (NO auto-fetch, NO polling)
 * - Manual "Generate Snapshot" with confirmation step
 * - Manual delete with confirmation
 * - All balances are historical "as of" snapshots, NOT live data
 * - Never says "current balance" — uses "as of" timestamps
 * - All errors include request_id
 */
export function NetWorthSnapshotPanel() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: orgLoaded } = useOrg();
  const evidenceContext = useFinancialEvidence();

  // List state
  const [snapshots, setSnapshots] = useState<AssetSnapshot[]>([]);
  const [listStatus, setListStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [listError, setListError] = useState<string | null>(null);
  const [listRequestId, setListRequestId] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  // Expanded snapshot for detail view
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create state
  const [createState, setCreateState] = useState<ActionState>({ status: "idle" });
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [lastCreated, setLastCreated] = useState<{ id: string; at: string } | null>(null);

  // Delete state
  const [deleteState, setDeleteState] = useState<Record<string, ActionState>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ==========================================================================
  // RBAC CHECK
  // ==========================================================================

  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const role = publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "org:admin";

  // ==========================================================================
  // REPORT TO CONSISTENCY CONTEXT (Phase 8D)
  // ==========================================================================

  useEffect(() => {
    if (!evidenceContext) return;
    if (listStatus !== "success") return;

    evidenceContext.updateAssetSnapshots({
      loaded: true,
      count: snapshots.length,
      snapshots: snapshots.map((s) => ({
        generatedAt: s.generated_at,
      })),
      fetchedAt,
    });
  }, [evidenceContext, listStatus, snapshots, fetchedAt]);

  // Don't render until auth is loaded
  if (!userLoaded || !orgLoaded) return null;

  // RBAC: Hide completely if not admin (no disabled buttons, no hints)
  if (!isAdmin) return null;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLoadSnapshots = async () => {
    if (listStatus === "loading") return;

    setListStatus("loading");
    setListError(null);
    setListRequestId(null);
    setSnapshots([]);
    setExpandedId(null);
    setLastCreated(null);

    try {
      const res = await fetch("/api/plaid/assets/report/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const requestId = res.headers.get("x-request-id");
      setListRequestId(requestId);

      const data: ListResponse = await res.json();

      if (!data.ok || !res.ok) {
        setListStatus("error");
        setListError(data.error || `Failed to load snapshots (${res.status})`);
        return;
      }

      setSnapshots(data.reports || []);
      setFetchedAt(new Date().toISOString());
      setListStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setListStatus("error");
      setListError(message);
    }
  };

  const handleCreateSnapshot = async () => {
    if (createState.status === "loading") return;

    setCreateState({ status: "loading" });
    setShowCreateConfirm(false);

    try {
      const res = await fetch("/api/plaid/assets/report/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const requestId = res.headers.get("x-request-id");
      const data: CreateResponse = await res.json();

      if (!data.ok || !res.ok) {
        setCreateState({
          status: "error",
          error: data.error || `Failed to create snapshot (${res.status})`,
          requestId: requestId || undefined,
        });
        return;
      }

      setCreateState({ status: "success" });
      setLastCreated({
        id: data.report_id || "unknown",
        at: data.generated_at || new Date().toISOString(),
      });

      // Reload list to show new snapshot
      await handleLoadSnapshots();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setCreateState({ status: "error", error: message });
    }
  };

  const handleDeleteSnapshot = async (reportId: string) => {
    const currentState = deleteState[reportId];
    if (currentState?.status === "loading") return;

    setDeleteState((prev) => ({
      ...prev,
      [reportId]: { status: "loading" },
    }));
    setConfirmDeleteId(null);

    try {
      const res = await fetch("/api/plaid/assets/report/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId }),
      });

      const requestId = res.headers.get("x-request-id");
      const data: RemoveResponse = await res.json();

      if (!data.ok || !res.ok) {
        setDeleteState((prev) => ({
          ...prev,
          [reportId]: {
            status: "error",
            error: data.error || `Failed to remove snapshot (${res.status})`,
            requestId: requestId || undefined,
          },
        }));
        return;
      }

      // Remove from local state
      setSnapshots((prev) => prev.filter((s) => s.report_id !== reportId));
      setDeleteState((prev) => ({
        ...prev,
        [reportId]: { status: "success" },
      }));

      if (expandedId === reportId) {
        setExpandedId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setDeleteState((prev) => ({
        ...prev,
        [reportId]: { status: "error", error: message },
      }));
    }
  };

  const toggleExpand = useCallback((reportId: string) => {
    setExpandedId((prev) => (prev === reportId ? null : reportId));
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Net Worth Snapshots</h2>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            Source: Plaid
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Historical asset snapshots. Read-only. Manual actions only.
        </p>
      </div>

      {/* Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
        <strong>Historical Asset Snapshot (Plaid)</strong>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <strong>Disclaimer:</strong> This snapshot reflects account balances at
        the time of generation and is not a live balance.
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleLoadSnapshots()}
          disabled={listStatus === "loading"}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {listStatus === "loading" ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Load Asset Snapshots
            </>
          )}
        </button>

        {!showCreateConfirm ? (
          <button
            type="button"
            onClick={() => setShowCreateConfirm(true)}
            disabled={createState.status === "loading"}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {createState.status === "loading" ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Generate Snapshot
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-900/30">
            <span className="text-sm text-amber-800 dark:text-amber-200">
              Generate new snapshot?
            </span>
            <button
              type="button"
              onClick={() => void handleCreateSnapshot()}
              className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setShowCreateConfirm(false)}
              className="rounded border border-amber-400 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-800/50"
            >
              Cancel
            </button>
          </div>
        )}

        {listStatus === "success" && (
          <span className="text-xs text-muted-foreground">
            {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} found
          </span>
        )}
      </div>

      {/* Create Success Message */}
      {lastCreated && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              Snapshot generated successfully as of{" "}
              <strong>{formatTimestamp(lastCreated.at)}</strong>
            </span>
          </div>
          <p className="mt-1 font-mono text-xs">ID: {lastCreated.id}</p>
        </div>
      )}

      {/* Create Error */}
      {createState.status === "error" && createState.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">{createState.error}</p>
              {createState.requestId && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  request_id: {createState.requestId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List Error */}
      {listStatus === "error" && listError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">{listError}</p>
              {listRequestId && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  request_id: {listRequestId}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {listStatus === "success" && snapshots.length === 0 && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          No asset snapshots available. Click "Generate Snapshot" to create one.
        </div>
      )}

      {/* Snapshots List */}
      {listStatus === "success" && snapshots.length > 0 && (
        <div className="space-y-3">
          {snapshots.map((snapshot) => {
            const isExpanded = expandedId === snapshot.report_id;
            const dlState = deleteState[snapshot.report_id] || { status: "idle" };
            const isConfirmingDelete = confirmDeleteId === snapshot.report_id;

            return (
              <div
                key={snapshot.report_id}
                className="rounded-lg border bg-card/50"
              >
                {/* Snapshot Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(snapshot.report_id)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-muted-foreground"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <div className="font-medium">
                        {formatCurrency(snapshot.total_assets)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>As of {formatTimestamp(snapshot.generated_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <span className="font-mono text-xs text-muted-foreground">
                      {snapshot.report_id.slice(0, 12)}...
                    </span>

                    {!isConfirmingDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(snapshot.report_id)}
                        disabled={dlState.status === "loading"}
                        className="inline-flex items-center gap-1 rounded border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {dlState.status === "loading" ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Remove
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-destructive">Delete?</span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSnapshot(snapshot.report_id)}
                          className="rounded bg-destructive px-2 py-0.5 text-xs text-white hover:bg-destructive/80"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted"
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Error */}
                {dlState.status === "error" && dlState.error && (
                  <div className="border-t px-4 py-2 bg-destructive/5">
                    <p className="text-xs text-destructive">{dlState.error}</p>
                    {dlState.requestId && (
                      <p className="font-mono text-[10px] text-muted-foreground">
                        request_id: {dlState.requestId}
                      </p>
                    )}
                  </div>
                )}

                {/* Expanded Detail View */}
                {isExpanded && snapshot.accounts.length > 0 && (
                  <div className="border-t">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30">
                          <tr className="text-left">
                            <th className="p-3 font-medium">Institution</th>
                            <th className="p-3 font-medium">Account</th>
                            <th className="p-3 font-medium">Type</th>
                            <th className="p-3 font-medium text-right">
                              Balance as of Snapshot
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {snapshot.accounts.map((acct, idx) => (
                            <tr
                              key={`${acct.institution_id}-${acct.account_mask}-${idx}`}
                              className="border-t"
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span>{acct.institution_name}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div>{acct.account_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  ****{acct.account_mask}
                                </div>
                              </td>
                              <td className="p-3 capitalize text-muted-foreground">
                                {acct.account_type}
                              </td>
                              <td className="p-3 text-right font-medium">
                                {formatCurrency(acct.balance_as_of)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 font-medium">
                          <tr>
                            <td colSpan={3} className="p-3 text-right">
                              Total as of {formatTimestamp(snapshot.generated_at)}:
                            </td>
                            <td className="p-3 text-right">
                              {formatCurrency(snapshot.total_assets)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Empty Accounts */}
                {isExpanded && snapshot.accounts.length === 0 && (
                  <div className="border-t p-4 text-sm text-muted-foreground">
                    No account details available for this snapshot.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Advisory */}
      <div className="rounded-lg border p-3 text-[10px] text-muted-foreground">
        Admin only. Manual actions required. No automatic refresh. All balances
        shown are historical snapshots "as of" generation time — not live data.
        All operations logged with request_id for audit provenance.
      </div>
    </div>
  );
}

export default NetWorthSnapshotPanel;
