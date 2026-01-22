"use client";

import { useState } from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type Props = {
  className?: string;
};

export default function ExportForDCAAPDFButton({ className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    try {
      setLoading(true);
      setError(null);

      // Use rawResponse to get the blob
      const res = await auditedFetch<Response>("/govcon/export/dcaa/pdf", {
        method: "POST",
        rawResponse: true,
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DCAA_Export.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
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
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
