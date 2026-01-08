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

  // Try to respect backend filename if provided, with security sanitization
  const cd = res.headers.get("content-disposition") || "";
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd);
  const rawFilename = decodeURIComponent(
    match?.[1] || match?.[2] || "export.csv"
  );
  // Security: Sanitize filename to prevent path traversal and injection
  const filename = rawFilename
    .replace(/[/\\:*?"<>|]/g, "_") // Remove dangerous characters
    .replace(/\.\./g, "_") // Prevent path traversal
    .slice(0, 255) || "export.csv"; // Limit length

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
