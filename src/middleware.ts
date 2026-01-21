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
 * - P0 MFA: Two-factor authentication enforcement (fail-closed)
 */

// Routes that require Clerk middleware (authenticated + auth flow)
const CLERK_ROUTES = [
  // Auth flow routes
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/mfa-setup(.*)",
  "/complete-profile(.*)",
  // Canonical dashboard entry routes
  "/dashboard(.*)",
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
  "/api/profile(.*)",
];

// Routes that need auth enforcement (subset of CLERK_ROUTES)
// Excludes auth flow routes, MFA setup, and profile completion (user needs to complete these first)
const PROTECTED_PREFIXES = CLERK_ROUTES.filter(
  (r) =>
    !r.startsWith("/sign-in") &&
    !r.startsWith("/sign-up") &&
    !r.startsWith("/onboarding") &&
    !r.startsWith("/mfa-setup") &&
    !r.startsWith("/complete-profile"),
);

// Routes that require MFA to be enabled (all protected routes)
const MFA_REQUIRED_ROUTES = PROTECTED_PREFIXES.filter(
  (r) => !r.startsWith("/api/"),
);

const requiresMFA = createRouteMatcher(MFA_REQUIRED_ROUTES);

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

  // Allow maintenance page itself
  if (pathname.startsWith("/maintenance")) {
    return NextResponse.next();
  }

  // Allow MFA setup page (user needs to complete setup)
  if (pathname.startsWith("/mfa-setup")) {
    return NextResponse.next();
  }

  // Allow profile completion page (user needs to complete profile)
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

  // P0 MFA ENFORCEMENT — Dashboard routes require MFA (fail-closed)
  // This checks if user has MFA enabled via Clerk session claims
  if (requiresMFA(req)) {
    const { sessionClaims, userId } = await auth();

    // If user is authenticated, check MFA status
    if (userId) {
      // Clerk stores MFA status in session claims when configured
      // Check if user has completed second factor verification
      const publicMetadata = sessionClaims?.publicMetadata as
        | Record<string, unknown>
        | undefined;

      // Check Clerk's built-in two-factor verification status
      // When MFA is required at Clerk level, sessions without MFA won't be issued
      // This is a defense-in-depth check for users who enrolled but haven't verified
      const hasMFAEnabled = Boolean(
        publicMetadata?.mfaEnabled ||
        sessionClaims?.["two_factor_enabled"] ||
        sessionClaims?.["mfa"]
      );

      // If MFA enforcement is enabled and user doesn't have MFA, redirect to setup
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
