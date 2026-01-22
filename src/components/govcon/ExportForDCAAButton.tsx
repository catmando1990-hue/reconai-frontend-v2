"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";
import { AuditEvidence } from "@/components/audit/AuditEvidence";

type Props = {
  className?: string;
};

export default function ExportForDCAAButton({ className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);

  async function handleExport() {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setLastRequestId(null);

      // Use rawResponse to get the blob, skipBodyValidation for non-JSON
      const res = await auditedFetch<Response>("/govcon/export/dcaa", {
        method: "POST",
        rawResponse: true,
      });

      // Capture request_id from response header for audit evidence
      const requestId = res.headers.get("x-request-id");
      setLastRequestId(requestId);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DCAA_Export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (e) {
      if (e instanceof AuditProvenanceError) {
        setError(`Provenance error: ${e.message}`);
      } else if (e instanceof HttpError) {
        setError(`Export failed (HTTP ${e.status})`);
      } else {
        setError("Unable to export at this time.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className={className}
      >
        <Download className="h-4 w-4" />
        {loading ? "Exporting…" : "Export for DCAA"}
      </button>
      {success && (
        <div>
          <div className="text-xs text-green-600">Export completed successfully.</div>
          <AuditEvidence requestId={lastRequestId} variant="success" />
        </div>
      )}
      {error && (
        <div>
          <div className="text-xs text-red-600">{error}</div>
          <AuditEvidence requestId={lastRequestId} variant="error" />
        </div>
      )}
    </div>
  );
}
