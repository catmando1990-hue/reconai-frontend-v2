"use client";

import { useState, useCallback } from "react";
import { Copy, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { DashTable, DashTableColumn } from "@/components/dashboard/DashTable";
import { StatusChip } from "@/components/dashboard/StatusChip";
import type { ExportRecord, ExportStatusVariant } from "@/types/admin-exports";

interface AdminExportsTableProps {
  exports: ExportRecord[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onViewProvenance: (exportId: string) => void;
}

/**
 * Get status variant for export status
 */
function getStatusVariant(status: ExportRecord["status"]): ExportStatusVariant {
  switch (status) {
    case "completed":
      return "ok";
    case "pending":
    case "processing":
      return "muted";
    case "failed":
    case "expired":
      return "warn";
    default:
      return "unknown";
  }
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Format date string for display
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * AdminExportsTable — Read-only table displaying export records
 * for internal admin visibility. No mutation actions.
 */
export function AdminExportsTable({
  exports,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onViewProvenance,
}: AdminExportsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = useCallback(async (id: string) => {
    const success = await copyToClipboard(id);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  const columns: DashTableColumn<ExportRecord>[] = [
    {
      key: "export_id",
      header: "Export ID",
      render: (row) => (
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded">
            {row.export_id.slice(0, 8)}...
          </code>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyId(row.export_id);
            }}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy full ID"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {copiedId === row.export_id && (
            <span className="text-xs text-green-600 dark:text-green-400">
              Copied
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusChip variant={getStatusVariant(row.status)}>
          {row.status.toUpperCase()}
        </StatusChip>
      ),
    },
    {
      key: "export_type",
      header: "Type",
      render: (row) => (
        <span className="text-sm">{row.export_type || "—"}</span>
      ),
    },
    {
      key: "file_size_bytes",
      header: "Size",
      render: (row) => (
        <span className="text-sm tabular-nums">
          {formatFileSize(row.file_size_bytes)}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "expires_at",
      header: "Expires",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.expires_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewProvenance(row.export_id);
          }}
          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          title="View provenance"
        >
          <Eye className="h-3.5 w-3.5" />
          Provenance
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DashTable
        data={exports}
        columns={columns}
        getRowKey={(row) => row.export_id}
        loading={loading}
        loadingRows={5}
        emptyContent={
          <div className="py-8 text-center text-muted-foreground">
            No exports found.
          </div>
        }
        getRowSeverity={(row) => {
          if (row.status === "failed") return "critical";
          if (row.status === "expired") return "warning";
          return undefined;
        }}
      />

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, totalCount)} of {totalCount} exports
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm border border-border hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-sm text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm border border-border hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
