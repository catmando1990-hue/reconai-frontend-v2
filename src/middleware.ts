import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * STEP 2 — Auth Isolation (Canonical Laws Compliant)
 *
 * ReconAI middleware (Edge-safe):
 * - Clerk middleware ONLY runs on authenticated routes
 * - Public/marketing routes bypass Clerk entirely (ZERO overhead)
 * - Auth routes (sign-in, sign-up) use Clerk for auth flow
 * - BUILD 8: Maintenance mode enforcement (fail-open)
 */

// Routes that require Clerk middleware (authenticated + auth flow)
const CLERK_ROUTES = [
  // Auth flow routes
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  // Protected dashboard routes (now under route group, keeping for legacy links)
  "/home(.*)",
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
  "/invoices(.*)",
  "/bills(.*)",
  "/customers(.*)",
  "/vendors(.*)",
  "/receipts(.*)",
  "/diagnostics(.*)",
  // API routes that require auth
  "/api/diagnostics(.*)",
  "/api/admin(.*)",
  "/api/me(.*)",
  "/api/audit(.*)",
  "/api/intelligence(.*)",
  "/api/plaid(.*)",
  "/api/dashboard(.*)",
  "/api/checkout(.*)",
  "/api/proxy-export(.*)",
  "/api/production(.*)",
];

// Routes that need auth enforcement (subset of CLERK_ROUTES)
const PROTECTED_PREFIXES = CLERK_ROUTES.filter(
  (r) =>
    !r.startsWith("/sign-in") &&
    !r.startsWith("/sign-up") &&
    !r.startsWith("/onboarding"),
);

const requiresClerk = createRouteMatcher(CLERK_ROUTES);
const isProtectedRoute = createRouteMatcher(PROTECTED_PREFIXES);

/**
 * BUILD 8: Check maintenance mode from backend API (fail-open).
 */
async function checkMaintenanceMode(): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return false;

  try {
    const res = await fetch(`${apiUrl}/api/maintenance/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return false;

    const data = await res.json();
    return Boolean(data?.enabled);
  } catch {
    return false; // fail open
  }
}

/**
 * Clerk middleware handler — only invoked for authenticated routes.
 */
const clerkHandler = clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Maintenance mode enforcement — PROTECTED ROUTES ONLY
  if (isProtectedRoute(req)) {
    const maintenanceMode = await checkMaintenanceMode();

    if (maintenanceMode) {
      const { sessionClaims } = await auth();
      const publicMetadata = sessionClaims?.publicMetadata as
        | Record<string, unknown>
        | undefined;
      const isAdmin =
        publicMetadata?.role === "admin" ||
        publicMetadata?.role === "org:admin";

      if (!isAdmin) {
        const url = req.nextUrl.clone();
        url.pathname = "/maintenance";
        return NextResponse.redirect(url);
      }
    }
  }

  // Allow maintenance page itself
  if (pathname.startsWith("/maintenance")) {
    return NextResponse.next();
  }

  // Protected routes are handled by server-side auth() in layouts
  return NextResponse.next();
});

/**
 * Main middleware: Routes Clerk only where needed.
 * Public/marketing routes get ZERO Clerk overhead.
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always skip Next internals and static assets
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // STEP 2: Only apply Clerk middleware to authenticated routes
  // This includes both page routes AND API routes that need auth
  if (requiresClerk(req)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return clerkHandler(req, {} as any);
  }

  // Public/marketing routes — ZERO Clerk overhead
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
