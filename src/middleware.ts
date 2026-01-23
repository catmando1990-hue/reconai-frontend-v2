import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * ReconAI Middleware
 *
 * PARALLEL HEADER STRATEGY:
 * - Edge config (next.config.ts): HSTS, X-Content-Type-Options, etc. (short, universal)
 * - Middleware (here): CSP, X-Frame-Options (long, route-specific)
 *
 * No key collision = no overwrite = both apply correctly
 */

// =========================================================================
// DASHBOARD ROUTE DETECTION
// =========================================================================

const DASHBOARD_ROUTE_PREFIXES = [
  "/dashboard",
  "/home",
  "/core",
  "/cfo",
  "/intelligence",
  "/govcon",
  "/settings",
  "/invoicing",
  "/connect-bank",
  "/customers",
  "/receipts",
  "/ar",
];

function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

// =========================================================================
// CSP CONFIGURATION
// =========================================================================

const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.dev",
    "https://clerk.reconaitechnology.com",
    "https://challenges.cloudflare.com",
    "https://vercel.live",
    "https://cdn.plaid.com",
  ],
  "worker-src": ["'self'", "blob:"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://*.clerk.dev",
    "https://*.clerk.accounts.dev",
    "https://img.clerk.com",
    "https://clerk.reconaitechnology.com",
    "https://*.vercel-storage.com",
    "https://*.public.blob.vercel-storage.com",
  ],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://*.clerk.dev",
    "https://*.clerk.accounts.dev",
    "https://clerk.reconaitechnology.com",
    "https://reconai-backend.onrender.com",
    "https://api.reconai.com",
    "https://*.vercel-storage.com",
    "https://vercel.live",
    "wss://*.clerk.dev",
    "wss://clerk.reconaitechnology.com",
    "https://production.plaid.com",
    "https://cdn.plaid.com",
  ],
  "media-src": [
    "'self'",
    "https://*.vercel-storage.com",
    "https://*.public.blob.vercel-storage.com",
    "blob:",
  ],
  "frame-src": [
    "'self'",
    "https://*.clerk.dev",
    "https://*.clerk.accounts.dev",
    "https://clerk.reconaitechnology.com",
    "https://challenges.cloudflare.com",
    "https://cdn.plaid.com",
  ],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
};

function buildCSP(frameAncestors: string): string {
  const directives = Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
  return `${directives}; upgrade-insecure-requests; frame-ancestors ${frameAncestors}`;
}

const CSP_STRICT = buildCSP("'none'");
const CSP_MODERATE = buildCSP("'self'");

// =========================================================================
// HEADER APPLICATION (CSP + X-Frame-Options only)
// =========================================================================

function applyRouteHeaders(headers: Headers, pathname: string): void {
  const isStrict = isDashboardRoute(pathname);

  headers.set("X-Frame-Options", isStrict ? "DENY" : "SAMEORIGIN");
  headers.set("Content-Security-Policy", isStrict ? CSP_STRICT : CSP_MODERATE);
}

// =========================================================================
// ROUTE MATCHERS
// =========================================================================

const PROTECTED_ROUTES = [
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

const MFA_REQUIRED_ROUTES = PROTECTED_ROUTES.filter(
  (r) => !r.startsWith("/api/")
);

const isProtectedRoute = createRouteMatcher(PROTECTED_ROUTES);
const requiresMFA = createRouteMatcher(MFA_REQUIRED_ROUTES);

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
// MAIN MIDDLEWARE
// =========================================================================

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Skip internals
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Auth flow routes
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/mfa-setup") ||
    pathname.startsWith("/complete-profile")
  ) {
    const response = NextResponse.next();
    applyRouteHeaders(response.headers, pathname);
    return response;
  }

  // Protected routes - maintenance & MFA checks
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
        const response = NextResponse.redirect(url);
        applyRouteHeaders(response.headers, pathname);
        return response;
      }
    }

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
          const response = NextResponse.redirect(url);
          applyRouteHeaders(response.headers, pathname);
          return response;
        }
      }
    }
  }

  // All routes - apply CSP and X-Frame-Options
  const response = NextResponse.next();
  applyRouteHeaders(response.headers, pathname);
  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
