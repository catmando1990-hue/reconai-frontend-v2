// src/app/api/proxy-export/route.ts
// Proxies backend /export for browser download. Forwards auth + org header.

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Strict validation for organization IDs to prevent header injection
const ORG_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

function validateOrgId(orgId: string | null): string | null {
  if (!orgId) return null;
  // Prevent header injection: no newlines, carriage returns, or special chars
  if (!ORG_ID_REGEX.test(orgId)) {
    return null;
  }
  return orgId;
}

function requireBackendUrl() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Set it in .env.local / hosting env.",
    );
  }
  // Validate URL format to prevent SSRF
  const parsed = new URL(url);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Invalid backend URL protocol");
  }
  return url.replace(/\/$/, "");
}

export async function GET(req: Request) {
  const BACKEND_URL = requireBackendUrl();

  // IMPORTANT: This requires Clerk middleware to be running.
  const authData = auth() as { getToken?: () => Promise<string | null> };

  // Some Clerk versions expose getToken on the returned object.
  const getTokenFn = authData?.getToken;
  if (typeof getTokenFn !== "function") {
    // Give a clear error for fast debugging
    return NextResponse.json(
      {
        error:
          "Clerk auth token helper unavailable. Ensure Clerk middleware is running at src/middleware.ts and restart dev server.",
        hint: "If you just added src/middleware.ts, stop and restart `npm run dev`.",
      },
      { status: 500 },
    );
  }

  const token: string | null = await getTokenFn.call(authData);

  // Forward org header from client request with strict validation
  const rawOrgId = req.headers.get("x-organization-id");
  const orgId = validateOrgId(rawOrgId);

  const upstream = await fetch(`${BACKEND_URL}/export`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(orgId ? { "X-Organization-ID": orgId } : {}),
    },
  });

  const body = await upstream.arrayBuffer();

  const contentType = upstream.headers.get("content-type") || "text/csv";
  const contentDisposition =
    upstream.headers.get("content-disposition") ||
    "attachment; filename=export.csv";

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
  });
}
