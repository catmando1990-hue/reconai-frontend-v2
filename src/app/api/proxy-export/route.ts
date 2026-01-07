// app/api/proxy-export/route.ts
// Proxies backend /export so browser download works cleanly with auth cookies/tokens.
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function GET(req: Request) {
  const { getToken } = await auth();
  const token = await getToken();

  const orgId = req.headers.get("x-organization-id") || "";

  const res = await fetch(`${BACKEND_URL}/export`, {
    method: "GET",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "X-Organization-ID": orgId,
    },
  });

  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "text/csv",
      "Content-Disposition": res.headers.get("content-disposition") || "attachment; filename=export.csv",
    },
  });
}
