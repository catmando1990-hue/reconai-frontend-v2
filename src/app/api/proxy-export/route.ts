// src/app/api/proxy-export/route.ts
// Proxies backend /export for browser download. Forwards auth + org header.
// NOTE: Clerk auth() may be async depending on SDK version — we await it.

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

function requireBackendUrl() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    // Fail loudly so misconfig doesn't look like an auth bug
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL. Set it in .env.local / hosting env.");
  }
  return url.replace(/\/$/, "");
}

export async function GET(req: Request) {
  const BACKEND_URL = requireBackendUrl();

  // Clerk token
  // In newer Clerk SDK versions, auth() returns a Promise
  const a = await auth();
  const token = await a.getToken();

  // Forward org header from client request
  const orgId = req.headers.get("x-organization-id") || "";

  const upstream = await fetch(`${BACKEND_URL}/export`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(orgId ? { "X-Organization-ID": orgId } : {}),
    },
  });

  const body = await upstream.arrayBuffer();

  // Preserve upstream headers where useful
  const contentType = upstream.headers.get("content-type") || "text/csv";
  const contentDisposition =
    upstream.headers.get("content-disposition") || "attachment; filename=export.csv";

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
  });
}
