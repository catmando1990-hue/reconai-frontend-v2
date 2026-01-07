// lib/api/export.ts
// Helper to download CSV exports from backend using the proxy route.

export async function downloadCsvExport() {
  const res = await fetch("/api/proxy-export");
  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
