import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * ReconAI Middleware - Enterprise Security Headers
 *
 * Architecture:
 * 1. Security headers are applied via middleware (not vercel.json) to avoid length limits
 * 2. Clerk middleware handles authentication for protected routes
 * 3. Response cloning ensures headers are mutable after Clerk processing
 *
 * Security Posture:
 * - Dashboard routes: frame-ancestors 'none' (no iframe embedding)
 * - Public routes: frame-ancestors 'self' (same-origin only)
 */

// =========================================================================
// CSP CONFIGURATION
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

// Base CSP directives (shared)
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

function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

// =========================================================================
// SECURITY HEADERS
// =========================================================================

interface SecurityHeaders {
  "Strict-Transport-Security": string;
  "X-Content-Type-Options": string;
  "X-XSS-Protection": string;
  "Referrer-Policy": string;
  "Permissions-Policy": string;
  "X-Frame-Options": string;
  "Content-Security-Policy": string;
}

function getSecurityHeaders(pathname: string): SecurityHeaders {
  const isStrict = isDashboardRoute(pathname);

  return {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), encrypted-media=*, accelerometer=*",
    "X-Frame-Options": isStrict ? "DENY" : "SAMEORIGIN",
    "Content-Security-Policy": isStrict ? CSP_STRICT : CSP_MODERATE,
  };
}

function applySecurityHeaders(response: NextResponse, pathname: string): void {
  const headers = getSecurityHeaders(pathname);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

// =========================================================================
// CLERK AUTH CONFIGURATION
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

  // Allow these routes without additional checks
  if (
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/mfa-setup") ||
    pathname.startsWith("/complete-profile")
  ) {
    return NextResponse.next();
  }

  // Maintenance mode enforcement
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

  // MFA enforcement
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

  return NextResponse.next();
});

// =========================================================================
// MAIN MIDDLEWARE
// =========================================================================

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals and static assets
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Routes requiring Clerk authentication
  if (requiresClerk(req)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clerkResponse = await clerkHandler(req, {} as any);

    // Handle redirects from Clerk (maintenance, MFA, etc.)
    if (clerkResponse && clerkResponse.status >= 300 && clerkResponse.status < 400) {
      const location = clerkResponse.headers.get("location");
      if (location) {
        const redirectResponse = NextResponse.redirect(location, clerkResponse.status);
        applySecurityHeaders(redirectResponse, pathname);
        return redirectResponse;
      }
    }

    // Create a fresh mutable response with security headers
    // This bypasses Clerk's immutable response issue
    const response = NextResponse.next({
      request: {
        headers: req.headers,
      },
    });

    applySecurityHeaders(response, pathname);
    return response;
  }

  // Public routes - no Clerk overhead
  const response = NextResponse.next();
  applySecurityHeaders(response, pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
