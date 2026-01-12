import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protected route prefixes - only these routes run Clerk auth
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/account",
  "/connect-bank",
  "/accounts",
  "/transactions",
  "/cash-flow",
  "/insights",
  "/alerts",
  "/ai-worker",
  "/compliance",
  "/certifications",
  "/financial-reports",
  "/cfo",
  "/core",
  "/intelligence",
  "/admin",
  "/settings",
  "/upload",
  "/properties",
  "/units",
  "/tenants",
  "/leases",
  "/rent-collection",
  "/dcaa",
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Maintenance mode check - runs on all routes (no Clerk dependency)
 */
async function checkMaintenanceMode(
  req: NextRequest,
  isAdmin: boolean,
): Promise<NextResponse | null> {
  // Only attempt Edge Config if env var is defined
  if (!process.env.EDGE_CONFIG) {
    return null;
  }

  try {
    const { createClient } = await import("@vercel/edge-config");
    const edgeConfig = createClient(process.env.EDGE_CONFIG);
    const maintenanceMode = Boolean(await edgeConfig.get("maintenance_mode"));

    const { pathname } = req.nextUrl;

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
  } catch {
    // Fail open: if Edge Config is unavailable, do not block users
  }

  return null;
}

/**
 * Middleware with selective Clerk auth:
 * - Maintenance mode check runs on ALL routes
 * - Clerk auth runs ONLY on protected routes
 * - Public routes have zero auth overhead
 */
export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // For protected routes: run full Clerk auth
  if (isProtectedRoute(pathname)) {
    const { sessionClaims } = await auth();
    const publicMetadata = sessionClaims?.publicMetadata as
      | Record<string, unknown>
      | undefined;
    const isAdmin = publicMetadata?.role === "admin";

    // Check maintenance mode (with admin bypass)
    const maintenanceRedirect = await checkMaintenanceMode(req, isAdmin);
    if (maintenanceRedirect) return maintenanceRedirect;

    return NextResponse.next();
  }

  // For public routes: only check maintenance mode (no Clerk auth overhead)
  const maintenanceRedirect = await checkMaintenanceMode(req, false);
  if (maintenanceRedirect) return maintenanceRedirect;

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
