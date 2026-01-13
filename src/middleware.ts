import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * ReconAI middleware (Edge-safe):
 * - Clerk middleware wraps all routes (required for server-side auth() calls)
 * - Auth protection is only enforced on protected routes
 * - Maintenance mode is evaluated globally (fail-open)
 * - Public pages still have minimal Clerk overhead (no auth enforcement)
 */

const PROTECTED_PREFIXES = [
  "/dashboard(.*)",
  "/account(.*)",
  "/connect-bank(.*)",
  "/accounts(.*)",
  "/transactions(.*)",
  "/cash-flow(.*)",
  "/insights(.*)",
  "/alerts(.*)",
  "/ai-worker(.*)",
  "/compliance(.*)",
  "/certifications(.*)",
  "/financial-reports(.*)",
  "/cfo(.*)",
  "/core(.*)",
  "/intelligence(.*)",
  "/admin(.*)",
  "/settings(.*)",
  "/upload(.*)",
  "/properties(.*)",
  "/units(.*)",
  "/tenants(.*)",
  "/leases(.*)",
  "/rent-collection(.*)",
  "/dcaa(.*)",
];

const isProtectedRoute = createRouteMatcher(PROTECTED_PREFIXES);

/**
 * Check maintenance mode from Edge Config (fail-open).
 */
async function checkMaintenanceMode(): Promise<boolean> {
  if (!process.env.EDGE_CONFIG) return false;

  try {
    const { createClient } = await import("@vercel/edge-config");
    const edgeConfig = createClient(process.env.EDGE_CONFIG);
    const value = await edgeConfig.get("maintenance_mode");
    return Boolean(value);
  } catch {
    return false; // fail open
  }
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Always allow Next internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check maintenance mode
  const maintenanceMode = await checkMaintenanceMode();

  if (maintenanceMode) {
    // Allow access to maintenance page itself
    if (pathname.startsWith("/maintenance")) return NextResponse.next();

    // Check admin bypass
    const { sessionClaims } = await auth();
    const publicMetadata = sessionClaims?.publicMetadata as
      | Record<string, unknown>
      | undefined;
    const isAdmin = publicMetadata?.role === "admin";

    if (!isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  // Protected routes are handled by server-side auth() in layouts
  // No redirect enforcement here - layouts handle that
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
