"use client";

import { useState } from "react";

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
      const res = await fetch("/govcon/export/dcaa/pdf", { method: "POST" });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DCAA_Export.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Unable to export PDF at this time.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleExport} disabled={loading} className={className}>
        {loading ? "Exporting…" : "Export for DCAA (PDF)"}
      </button>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
