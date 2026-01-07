// src/app/api/proxy-export/route.ts
// Proxies backend /export for browser download. Forwards auth + org header.

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

function requireBackendUrl() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Set it in .env.local / hosting env."
    );
  }
  return url.replace(/\/$/, "");
}

export async function GET(req: Request) {
  const BACKEND_URL = requireBackendUrl();

  // IMPORTANT: This requires Clerk middleware to be running.
  const authData: any = auth();

  // Some Clerk versions expose getToken on the returned object.
  const getTokenFn = authData?.getToken;
  if (typeof getTokenFn !== "function") {
    // Give a clear error for fast debugging
    return NextResponse.json(
      {
        error:
          "Clerk auth token helper unavailable. Ensure Clerk middleware is running at src/middleware.ts and restart dev server.",
        hint:
          "If you just added src/middleware.ts, stop and restart `npm run dev`.",
      },
      { status: 500 }
    );
  }

  const token: string | null = await getTokenFn.call(authData);

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
