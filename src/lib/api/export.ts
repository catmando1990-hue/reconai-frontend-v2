// src/lib/api/export.ts
// Downloads CSV export via Next.js proxy route.
// REQUIRED: pass orgId so backend can scope data correctly.

export async function downloadCsvExport(opts: { orgId: string }) {
  const orgId = opts?.orgId?.trim();
  if (!orgId) throw new Error("downloadCsvExport: orgId is required");

  const res = await fetch("/api/proxy-export", {
    method: "GET",
    headers: {
      "x-organization-id": orgId,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Export failed (${res.status}): ${text || res.statusText}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;

  // Try to respect backend filename if provided
  const cd = res.headers.get("content-disposition") || "";
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
  const filename = decodeURIComponent(match?.[1] || match?.[2] || "export.csv");

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
