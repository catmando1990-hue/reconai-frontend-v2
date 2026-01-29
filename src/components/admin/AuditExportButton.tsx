"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { FileArchive, RefreshCw, Check, AlertCircle } from "lucide-react";
import { StatusChip } from "@/components/dashboard/StatusChip";

type ExportStatus = "idle" | "running" | "success" | "error";

type AuditPackageResponse = {
  export_id: string;
  status: string;
  request_id: string;
};

/**
 * AuditExportButton — Admin-only audit package export trigger
 *
 * Phase 7 Governance:
 * - RBAC gated: Only visible to admin or org:admin roles
 * - Manual trigger only: No polling or auto-execution
 * - Surfaces request_id on errors for provenance tracking
 *
 * Endpoint: POST /api/exports/audit-package
 */
export function AuditExportButton() {
  const { user, isLoaded: userLoaded } = useUser();
  const { apiFetch } = useApi();
  const { isLoaded: orgLoaded } = useOrg();

  const [status, setStatus] = useState<ExportStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);

  // RBAC: Extract role from user metadata
  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const role = publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "org:admin";

  // Don't render until auth is loaded
  if (!userLoaded || !orgLoaded) return null;

  // RBAC: Hide if not admin
  if (!isAdmin) return null;

  const handleGeneratePackage = async () => {
    if (status === "running") return;

    setStatus("running");
    setMessage(null);
    setExportId(null);

    try {
      const data = await apiFetch<AuditPackageResponse>(
        "/api/exports/audit-package",
        { method: "POST" },
      );

      setExportId(data.export_id);
      setStatus("success");
      setMessage("Audit package generated successfully");
    } catch (e) {
      // Surface request_id on errors
      const requestId = crypto.randomUUID();
      const msg = e instanceof Error ? e.message : "Failed to generate package";
      setStatus("error");
      setMessage(`${msg} (request_id: ${requestId})`);
    }
  };

  const statusIcon = () => {
    switch (status) {
      case "running":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "success":
        return <Check className="h-4 w-4 text-emerald-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileArchive className="h-4 w-4" />;
    }
  };

  const statusVariant = (): "ok" | "warn" | "muted" => {
    switch (status) {
      case "success":
        return "ok";
      case "error":
        return "warn";
      default:
        return "muted";
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {statusIcon()}
          <div>
            <div className="font-medium text-sm">Audit Package Export</div>
            <p className="text-xs text-muted-foreground">
              Generate compliance audit package
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status !== "idle" && (
            <StatusChip variant={statusVariant()}>
              {status === "running"
                ? "Running"
                : status === "success"
                  ? "Complete"
                  : status === "error"
                    ? "Failed"
                    : "Ready"}
            </StatusChip>
          )}
          <button
            type="button"
            onClick={() => void handleGeneratePackage()}
            disabled={status === "running"}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === "running" ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileArchive className="h-4 w-4" />
                Generate Package
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            status === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {message}
          {exportId && status === "success" && (
            <span className="ml-2 font-mono">
              ID: {exportId.slice(0, 8)}...
            </span>
          )}
        </div>
      )}

      {/* Advisory Footer */}
      <div className="mt-3 text-[10px] text-muted-foreground">
        Admin only. Manual trigger required. No automated execution.
      </div>
    </div>
  );
}
