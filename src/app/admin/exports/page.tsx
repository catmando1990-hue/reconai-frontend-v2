"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminExportsTable } from "@/components/admin/AdminExportsTable";
import { ExportProvenanceDrawer } from "@/components/admin/ExportProvenanceDrawer";
import type { ExportRecord, ExportsListResponse } from "@/types/admin-exports";
import { auditedFetch, HttpError } from "@/lib/auditedFetch";

/**
 * Admin Exports Page
 *
 * Read-only internal visibility into exports and their evidence provenance.
 * Admin-only access. No mutation actions.
 */
export default function AdminExportsPage() {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Provenance drawer state
  const [selectedExportId, setSelectedExportId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch exports list
  const fetchExports = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      setError(null);

      try {
        const data = await auditedFetch<ExportsListResponse>(
          `/api/admin/exports?page=${pageNum}&page_size=${pageSize}`,
          { skipBodyValidation: true },
        );
        setExports(data.exports || []);
        setTotalCount(data.total_count || 0);
      } catch (err) {
        if (err instanceof HttpError) {
          if (err.status === 401) {
            setError("Not authenticated. Please sign in.");
          } else if (err.status === 403) {
            setError("Access denied. Admin only.");
          } else {
            const body = err.body as
              | { message?: string; error?: string }
              | undefined;
            setError(body?.message || body?.error || `Error: ${err.status}`);
          }
        } else {
          setError(
            `Failed to fetch exports: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  // Initial fetch
  useEffect(() => {
    fetchExports(page);
  }, [page, fetchExports]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Handle view provenance
  const handleViewProvenance = useCallback((exportId: string) => {
    setSelectedExportId(exportId);
    setDrawerOpen(true);
  }, []);

  // Close provenance drawer
  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedExportId(null);
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl space-y-6 p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-semibold">Exports Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only view of exports and their evidence provenance. Internal
            admin only.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : totalCount}
            </div>
            <div className="text-sm text-muted-foreground">Total Exports</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">
              {loading
                ? "—"
                : exports.filter((e) => e.status === "completed").length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {loading
                ? "—"
                : exports.filter(
                    (e) => e.status === "pending" || e.status === "processing",
                  ).length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
              {loading
                ? "—"
                : exports.filter(
                    (e) => e.status === "failed" || e.status === "expired",
                  ).length}
            </div>
            <div className="text-sm text-muted-foreground">Failed/Expired</div>
          </div>
        </div>

        {/* Exports Table */}
        <div className="rounded-lg border border-border bg-card/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Export Records</h2>
            <button
              type="button"
              onClick={() => fetchExports(page)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm border border-border hover:bg-muted/50 disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <AdminExportsTable
            exports={exports}
            loading={loading}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onViewProvenance={handleViewProvenance}
          />
        </div>

        {/* Info Footer */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> This page provides read-only visibility into
            exports for compliance and auditing purposes. No actions can be
            taken from this interface. Evidence provenance shows the audit trail
            linking exports to their source evidence.
          </p>
        </div>
      </div>

      {/* Provenance Drawer */}
      <ExportProvenanceDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        exportId={selectedExportId}
      />
    </>
  );
}
