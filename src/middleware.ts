import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * ReconAI Middleware - Enterprise Security Headers
 *
 * Key insight: Clerk's middleware response may be immutable.
 * Solution: Use Next.js headers() in config OR apply via response creation.
 *
 * This version keeps the original Clerk structure intact and applies
 * headers through Next.js config headers (see next.config.ts).
 *
 * Security headers (CSP, X-Frame-Options) are set via next.config.ts headers()
 * to avoid conflicts with Clerk's response handling.
 */

// =========================================================================
// CLERK ROUTE MATCHERS
// =========================================================================

const CLERK_ROUTES = [
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/mfa-setup(.*)",
  "/complete-profile(.*)",
  "/dashboard(.*)",
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
  "/govcon(.*)",
  "/ar(.*)",
  "/invoicing(.*)",
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
  "/api/profile(.*)",
];

const PROTECTED_PREFIXES = CLERK_ROUTES.filter(
  (r) =>
    !r.startsWith("/sign-in") &&
    !r.startsWith("/sign-up") &&
    !r.startsWith("/onboarding") &&
    !r.startsWith("/mfa-setup") &&
    !r.startsWith("/complete-profile")
);

const MFA_REQUIRED_ROUTES = PROTECTED_PREFIXES.filter(
  (r) => !r.startsWith("/api/")
);

const requiresMFA = createRouteMatcher(MFA_REQUIRED_ROUTES);
const requiresClerk = createRouteMatcher(CLERK_ROUTES);
const isProtectedRoute = createRouteMatcher(PROTECTED_PREFIXES);

// =========================================================================
// MAINTENANCE MODE
// =========================================================================

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
    return false;
  }
}

// =========================================================================
// CLERK MIDDLEWARE HANDLER
// =========================================================================

const clerkHandler = clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Allow maintenance page itself
  if (pathname.startsWith("/maintenance")) {
    return NextResponse.next();
  }

  // Allow MFA setup page
  if (pathname.startsWith("/mfa-setup")) {
    return NextResponse.next();
  }

  // Allow profile completion page
  if (pathname.startsWith("/complete-profile")) {
    return NextResponse.next();
  }

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

  // P0 MFA ENFORCEMENT
  if (requiresMFA(req)) {
    const { sessionClaims, userId } = await auth();

    if (userId) {
      const publicMetadata = sessionClaims?.publicMetadata as
        | Record<string, unknown>
        | undefined;

      const hasMFAEnabled = Boolean(
        publicMetadata?.mfaEnabled ||
          sessionClaims?.["two_factor_enabled"] ||
          sessionClaims?.["mfa"]
      );

      const enforceMFA = process.env.NEXT_PUBLIC_ENFORCE_MFA === "true";

      if (enforceMFA && !hasMFAEnabled) {
        const url = req.nextUrl.clone();
        url.pathname = "/mfa-setup";
        url.searchParams.set("redirect_url", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // Protected routes are handled by server-side auth() in layouts
  return NextResponse.next();
});

// =========================================================================
// MAIN MIDDLEWARE
// =========================================================================

/**
 * Main middleware: Routes Clerk only where needed.
 *
 * NOTE: Security headers (CSP, X-Frame-Options, etc.) are handled by
 * next.config.ts headers() function. This avoids conflicts with Clerk's
 * immutable response objects.
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always skip Next internals and static assets
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Only apply Clerk middleware to authenticated routes
  if (requiresClerk(req)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return clerkHandler(req, {} as any);
  }

  // Public/marketing routes — ZERO Clerk overhead
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
