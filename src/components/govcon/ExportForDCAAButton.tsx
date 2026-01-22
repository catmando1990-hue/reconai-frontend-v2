"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type Props = {
  className?: string;
};

export default function ExportForDCAAButton({ className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    try {
      setLoading(true);
      setError(null);

      // Use rawResponse to get the blob, skipBodyValidation for non-JSON
      const res = await auditedFetch<Response>("/govcon/export/dcaa", {
        method: "POST",
        rawResponse: true,
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DCAA_Export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
