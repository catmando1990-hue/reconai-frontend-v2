import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@vercel/edge-config";
import { auth } from "@clerk/nextjs/server";

export async function middleware(req: NextRequest) {
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.publicMetadata?.role === "admin";

  // Read maintenance flag from Edge Config (lazy initialization at request time)
  let maintenanceMode = false;
  try {
    const edgeConfig = createClient(process.env.EDGE_CONFIG);
    maintenanceMode = Boolean(await edgeConfig.get("maintenance_mode"));
  } catch {
    // If Edge Config is unavailable, fail open (do not lock out production)
    maintenanceMode = false;
  }

  const url = req.nextUrl.clone();

  // Enforce maintenance mode globally for non-admins
  if (
    maintenanceMode &&
    !isAdmin &&
    !url.pathname.startsWith("/maintenance") &&
    !url.pathname.startsWith("/api")
  ) {
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
