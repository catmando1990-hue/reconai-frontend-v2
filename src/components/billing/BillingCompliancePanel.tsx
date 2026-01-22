"use client";

import * as React from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type RetentionPolicy = {
  org_id: string;
  retention_days: number;
  auto_delete_enabled: boolean;
  request_id: string;
};

type ExportResult = {
  request_id: string;
  status: string;
  format: string;
  record_count?: number;
  download_url?: string;
  audit_seal?: string;
};

type DeleteResult = {
  request_id: string;
  status: string;
  records_deleted: number;
  audit_seal: string;
  immutable_log_id: string;
};

export function BillingCompliancePanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [policy, setPolicy] = React.useState<RetentionPolicy | null>(null);
  const [exportResult, setExportResult] = React.useState<ExportResult | null>(
    null,
  );
  const [deleteResult, setDeleteResult] = React.useState<DeleteResult | null>(
    null,
  );

  // Form state
  const [retentionDays, setRetentionDays] = React.useState("365");
  const [autoDelete, setAutoDelete] = React.useState(false);
  const [exportConfirm, setExportConfirm] = React.useState("");
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [deleteReason, setDeleteReason] = React.useState("");
  const [processing, setProcessing] = React.useState(false);

  const handleError = (e: unknown, fallbackMessage: string) => {
    if (e instanceof AuditProvenanceError) {
      setErr(`Provenance error: ${e.message}`);
    } else if (e instanceof HttpError) {
      setErr(`HTTP ${e.status}: ${e.message}`);
    } else {
      setErr(e instanceof Error ? e.message : fallbackMessage);
    }
  };

  const fetchPolicy = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const json = await auditedFetch<RetentionPolicy>(
        `${apiBase}/api/billing/retention/policy`,
        { credentials: "include" },
      );
      setPolicy(json);
      setRetentionDays(String(json.retention_days));
      setAutoDelete(json.auto_delete_enabled);
    } catch (e: unknown) {
      handleError(e, "Failed to load retention policy");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const savePolicy = async () => {
    setProcessing(true);
    setErr(null);
    try {
      const json = await auditedFetch<RetentionPolicy>(
        `${apiBase}/api/billing/retention/policy`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            retention_days: parseInt(retentionDays, 10),
            auto_delete_enabled: autoDelete,
          }),
        },
      );

      setPolicy(json);
    } catch (e: unknown) {
      handleError(e, "Failed to save policy");
    } finally {
      setProcessing(false);
    }
  };

  const requestExport = async () => {
    if (exportConfirm !== "EXPORT MY DATA") {
      setErr('Please type "EXPORT MY DATA" to confirm export request.');
      return;
    }

    setProcessing(true);
    setErr(null);
    setExportResult(null);
    try {
      const json = await auditedFetch<ExportResult>(
        `${apiBase}/api/billing/retention/export`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            confirmation_phrase: exportConfirm,
            include_invoices: true,
            include_transactions: true,
            include_audit_log: true,
          }),
        },
      );

      setExportResult(json);
      setExportConfirm("");
    } catch (e: unknown) {
      handleError(e, "Failed to request export");
    } finally {
      setProcessing(false);
    }
  };

  const requestDelete = async () => {
    if (deleteConfirm !== "DELETE MY DATA") {
      setErr('Please type "DELETE MY DATA" to confirm deletion request.');
      return;
    }
    if (!deleteReason || deleteReason.length < 10) {
      setErr(
        "Please provide a reason (at least 10 characters) for the deletion request.",
      );
      return;
    }

    setProcessing(true);
    setErr(null);
    setDeleteResult(null);
    try {
      const json = await auditedFetch<DeleteResult>(
        `${apiBase}/api/billing/retention/delete`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({
            confirmation_phrase: deleteConfirm,
            reason: deleteReason,
            retain_audit_seal: true,
          }),
        },
      );

      setDeleteResult(json);
      setDeleteConfirm("");
    } catch (e: unknown) {
      handleError(e, "Failed to request deletion");
    } finally {
      setProcessing(false);
    }
  };

  React.useEffect(() => {
    // Manual-first UX: fetch once on mount only (no polling).
    fetchPolicy();
  }, [fetchPolicy]);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Data Retention & Compliance</div>
          <div className="text-xs opacity-70">
            Right-to-export and right-to-delete with immutable audit sealing.
          </div>
        </div>
        <button
          type="button"
          onClick={fetchPolicy}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {/* Retention Policy Section */}
      <div className="mt-4 rounded-xl border p-3">
        <div className="text-sm font-medium mb-3">Retention Policy</div>
        <div className="grid gap-3">
          <div>
            <label className="text-xs opacity-70 block mb-1">
              Retention Period (days)
            </label>
            <input
              type="number"
              min="30"
              max="3650"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoDelete"
              checked={autoDelete}
              onChange={(e) => setAutoDelete(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoDelete" className="text-sm">
              Enable auto-delete after retention period
            </label>
          </div>
          <button
            type="button"
            onClick={savePolicy}
            disabled={processing}
            className="rounded-xl border bg-blue-600 text-white px-4 py-2 text-sm"
          >
            {processing ? "Saving..." : "Save Policy"}
          </button>
        </div>
        {policy ? (
          <div className="mt-2 text-xs opacity-50">
            Request ID: {policy.request_id}
          </div>
        ) : null}
      </div>

      {/* Right to Export Section */}
      <div className="mt-4 rounded-xl border p-3">
        <div className="text-sm font-medium mb-3">
          Right to Export (GDPR/CCPA)
        </div>
        <div className="grid gap-3">
          <div>
            <label className="text-xs opacity-70 block mb-1">
              Type &quot;EXPORT MY DATA&quot; to confirm
            </label>
            <input
              type="text"
              value={exportConfirm}
              onChange={(e) => setExportConfirm(e.target.value)}
              placeholder="EXPORT MY DATA"
              className="rounded-lg border px-3 py-2 text-sm w-full font-mono"
            />
          </div>
          <button
            type="button"
            onClick={requestExport}
            disabled={processing || exportConfirm !== "EXPORT MY DATA"}
            className="rounded-xl border bg-green-600 text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            {processing ? "Processing..." : "Request Data Export"}
          </button>
        </div>
        {exportResult ? (
          <div className="mt-3 rounded-lg border p-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Status</span>
              <span>{exportResult.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Records</span>
              <span>{exportResult.record_count ?? 0}</span>
            </div>
            {exportResult.audit_seal ? (
              <div className="flex justify-between">
                <span className="opacity-70">Audit Seal</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {exportResult.audit_seal}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="opacity-70">Request ID</span>
              <span className="font-mono text-xs">
                {exportResult.request_id}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Right to Delete Section */}
      <div className="mt-4 rounded-xl border border-red-200 p-3">
        <div className="text-sm font-medium mb-3 text-red-600">
          Right to Delete (Destructive)
        </div>
        <div className="grid gap-3">
          <div className="text-xs text-red-500">
            Warning: This action is irreversible. All billing data will be
            permanently deleted and an immutable audit record will be created.
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1">
              Reason for deletion (required, min 10 chars)
            </label>
            <input
              type="text"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g. Account closure requested by user"
              className="rounded-lg border border-red-300 px-3 py-2 text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs opacity-70 block mb-1">
              Type &quot;DELETE MY DATA&quot; to confirm
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE MY DATA"
              className="rounded-lg border border-red-300 px-3 py-2 text-sm w-full font-mono"
            />
          </div>
          <button
            type="button"
            onClick={requestDelete}
            disabled={
              processing ||
              deleteConfirm !== "DELETE MY DATA" ||
              deleteReason.length < 10
            }
            className="rounded-xl border bg-red-600 text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            {processing ? "Processing..." : "Request Data Deletion"}
          </button>
        </div>
        {deleteResult ? (
          <div className="mt-3 rounded-lg border border-red-200 p-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Status</span>
              <span>{deleteResult.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Records Deleted</span>
              <span>{deleteResult.records_deleted}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Audit Seal</span>
              <span className="font-mono text-xs truncate max-w-[200px]">
                {deleteResult.audit_seal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Immutable Log</span>
              <span className="font-mono text-xs">
                {deleteResult.immutable_log_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Request ID</span>
              <span className="font-mono text-xs">
                {deleteResult.request_id}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
