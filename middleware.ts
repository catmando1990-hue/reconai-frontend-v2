import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { get } from "@vercel/edge-config";
import { auth } from "@clerk/nextjs/server";

export async function middleware(req: NextRequest) {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.publicMetadata?.role;

  const maintenance = await get<boolean>("maintenance_mode");

  const isAdmin = role === "admin";
  const isMaintenancePage = req.nextUrl.pathname.startsWith("/maintenance");

  if (maintenance && !isAdmin && !isMaintenancePage) {
    return NextResponse.redirect(new URL("/maintenance", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
