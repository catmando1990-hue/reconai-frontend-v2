"use client";

import { useState } from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";
import { AuditEvidence } from "@/components/audit/AuditEvidence";

type Props = {
  className?: string;
};

export default function ExportForDCAAPDFButton({ className }: Props) {
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

      // Use rawResponse to get the blob
      const res = await auditedFetch<Response>("/govcon/export/dcaa/pdf", {
        method: "POST",
        rawResponse: true,
      });

      // Capture request_id from response header for audit evidence
      const requestId = res.headers.get("x-request-id");
      setLastRequestId(requestId);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DCAA_Export.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (e) {
      if (e instanceof AuditProvenanceError) {
        setError(`Provenance error: ${e.message}`);
      } else if (e instanceof HttpError) {
        setError(`Export failed (HTTP ${e.status})`);
      } else {
        setError("Unable to export PDF at this time.");
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
        {loading ? "Exporting…" : "Export for DCAA (PDF)"}
      </button>
      {success && (
        <div>
          <div className="text-xs text-green-600">
            PDF export completed successfully.
          </div>
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
