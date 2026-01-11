import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Middleware using Clerk's official clerkMiddleware() pattern.
 *
 * Features:
 * - Maintenance mode via Vercel Edge Config (admin bypass)
 * - Fails OPEN: if EDGE_CONFIG is missing or throws, site remains accessible
 * - No Node-only imports (Edge runtime compatible)
 */
export default clerkMiddleware(async (auth, req) => {
  // Get session claims from Clerk's auth helper
  const { sessionClaims } = await auth();
  const publicMetadata = sessionClaims?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const isAdmin = publicMetadata?.role === "admin";

  // Read maintenance mode from Edge Config (fail open)
  let maintenanceMode = false;

  // Only attempt Edge Config if env var is defined
  if (process.env.EDGE_CONFIG) {
    try {
      // Dynamic import to avoid module-scope evaluation issues
      const { createClient } = await import("@vercel/edge-config");
      const edgeConfig = createClient(process.env.EDGE_CONFIG);
      const value = await edgeConfig.get("maintenance_mode");
      maintenanceMode = Boolean(value);
    } catch {
      // Fail open: if Edge Config is unavailable, do not block users
      maintenanceMode = false;
    }
  }

  const { pathname } = req.nextUrl;

  // Redirect non-admins to /maintenance when maintenance mode is enabled
  if (
    maintenanceMode &&
    !isAdmin &&
    !pathname.startsWith("/maintenance") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
