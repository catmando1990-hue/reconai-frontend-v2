import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// =============================================================================
// STRICT ROUTES (X-Frame-Options: DENY, frame-ancestors 'none')
// =============================================================================
// Be explicit. No prefix matching. List every route pattern.

const STRICT_ROUTES = createRouteMatcher([
  "/dashboard(.*)",
  "/home(.*)",
  "/home",
  "/core(.*)",
  "/core",
  "/cfo(.*)",
  "/cfo",
  "/intelligence(.*)",
  "/intelligence",
  "/govcon(.*)",
  "/govcon",
  "/settings(.*)",
  "/settings",
  "/invoicing(.*)",
  "/invoicing",
  "/connect-bank(.*)",
  "/connect-bank",
  "/customers(.*)",
  "/customers",
  "/receipts(.*)",
  "/receipts",
  "/ar(.*)",
  "/ar",
]);

// =============================================================================
// CSP DIRECTIVES
// =============================================================================

const CSP_BASE = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.reconaitechnology.com https://challenges.cloudflare.com https://vercel.live https://cdn.plaid.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.clerk.dev https://*.clerk.accounts.dev https://img.clerk.com https://clerk.reconaitechnology.com https://*.vercel-storage.com https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.reconaitechnology.com https://reconai-backend.onrender.com https://api.reconai.com https://*.vercel-storage.com https://vercel.live wss://*.clerk.dev wss://clerk.reconaitechnology.com https://production.plaid.com https://cdn.plaid.com",
  "media-src 'self' https://*.vercel-storage.com https://*.public.blob.vercel-storage.com blob:",
  "frame-src 'self' https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.reconaitechnology.com https://challenges.cloudflare.com https://cdn.plaid.com",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const CSP_STRICT = `${CSP_BASE}; frame-ancestors 'none'`;
const CSP_PUBLIC = `${CSP_BASE}; frame-ancestors 'self'`;

// =============================================================================
// SECURITY HEADERS
// =============================================================================

function getHeaders(isStrict: boolean) {
  return {
    "Content-Security-Policy": isStrict ? CSP_STRICT : CSP_PUBLIC,
    "X-Frame-Options": isStrict ? "DENY" : "SAMEORIGIN",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), encrypted-media=*, accelerometer=*",
  };
}

function applyHeaders(response: NextResponse, req: NextRequest): NextResponse {
  const isStrict = STRICT_ROUTES(req);
  const headers = getHeaders(isStrict);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

// =============================================================================
// PROTECTED ROUTES (require auth)
// =============================================================================

const PROTECTED_ROUTES = createRouteMatcher([
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
]);

const MFA_ROUTES = createRouteMatcher([
  "/dashboard(.*)",
  "/home(.*)",
  "/account(.*)",
  "/connect-bank(.*)",
  "/cfo(.*)",
  "/core(.*)",
  "/intelligence(.*)",
  "/admin(.*)",
  "/settings(.*)",
  "/customers(.*)",
  "/receipts(.*)",
  "/govcon(.*)",
  "/ar(.*)",
  "/invoicing(.*)",
]);

// =============================================================================
// MAINTENANCE MODE
// =============================================================================

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

// =============================================================================
// MIDDLEWARE
// =============================================================================

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Skip static
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Auth pages - just apply headers
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/mfa-setup") ||
    pathname.startsWith("/complete-profile")
  ) {
    return applyHeaders(NextResponse.next(), req);
  }

  // Protected routes
  if (PROTECTED_ROUTES(req)) {
    // Maintenance check
    const maintenance = await checkMaintenanceMode();
    if (maintenance) {
      const { sessionClaims } = await auth();
      const meta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined;
      const isAdmin = meta?.role === "admin" || meta?.role === "org:admin";

      if (!isAdmin) {
        const url = req.nextUrl.clone();
        url.pathname = "/maintenance";
        return applyHeaders(NextResponse.redirect(url), req);
      }
    }

    // MFA check
    if (MFA_ROUTES(req)) {
      const { sessionClaims, userId } = await auth();

      if (userId && process.env.NEXT_PUBLIC_ENFORCE_MFA === "true") {
        const meta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined;
        const hasMFA = Boolean(
          meta?.mfaEnabled ||
          sessionClaims?.["two_factor_enabled"] ||
          sessionClaims?.["mfa"]
        );

        if (!hasMFA) {
          const url = req.nextUrl.clone();
          url.pathname = "/mfa-setup";
          url.searchParams.set("redirect_url", pathname);
          return applyHeaders(NextResponse.redirect(url), req);
        }
      }
    }
  }

  // All routes get headers
  return applyHeaders(NextResponse.next(), req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
