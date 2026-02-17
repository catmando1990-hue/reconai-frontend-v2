import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// =============================================================================
// STRICT ROUTES (X-Frame-Options: DENY, frame-ancestors 'none')
// =============================================================================

const STRICT_ROUTES = createRouteMatcher([
  "/dashboard(.*)",
  "/home(.*)",
  "/home",
  "/core(.*)",
  "/core",
  "/cfo(.*)",
  "/cfo",
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
// APPLY HEADERS (Following Clerk's manual CSP pattern)
// =============================================================================

function createResponseWithHeaders(req: NextRequest): NextResponse {
  const isStrict = STRICT_ROUTES(req);
  const csp = isStrict ? CSP_STRICT : CSP_PUBLIC;
  const xfo = isStrict ? "DENY" : "SAMEORIGIN";

  // Create new request headers with CSP
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("Content-Security-Policy", csp);

  // Create response with modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Also set on response headers
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", xfo);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), encrypted-media=*, accelerometer=*",
  );

  return response;
}

function createRedirectWithHeaders(
  req: NextRequest,
  destination: string,
): NextResponse {
  const isStrict = STRICT_ROUTES(req);
  const csp = isStrict ? CSP_STRICT : CSP_PUBLIC;
  const xfo = isStrict ? "DENY" : "SAMEORIGIN";

  const url = req.nextUrl.clone();
  url.pathname = destination;

  const response = NextResponse.redirect(url);

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", xfo);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), encrypted-media=*, accelerometer=*",
  );

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
  "/payroll(.*)",
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
  "/payroll(.*)",
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
// MIDDLEWARE - No contentSecurityPolicy option = Clerk won't inject CSP
// =============================================================================

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Skip static files completely
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Auth pages - return response with headers
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/mfa-setup") ||
    pathname.startsWith("/complete-profile")
  ) {
    return createResponseWithHeaders(req);
  }

  // Protected routes
  if (PROTECTED_ROUTES(req)) {
    // Maintenance check
    const maintenance = await checkMaintenanceMode();
    if (maintenance) {
      const { sessionClaims } = await auth();
      const meta = sessionClaims?.publicMetadata as
        | Record<string, unknown>
        | undefined;
      const isAdmin = meta?.role === "admin" || meta?.role === "org:admin";

      if (!isAdmin) {
        return createRedirectWithHeaders(req, "/maintenance");
      }
    }

    // MFA check
    if (MFA_ROUTES(req)) {
      const { sessionClaims, userId } = await auth();

      if (userId && process.env.NEXT_PUBLIC_ENFORCE_MFA === "true") {
        const meta = sessionClaims?.publicMetadata as
          | Record<string, unknown>
          | undefined;
        const hasMFA = Boolean(
          meta?.mfaEnabled ||
          sessionClaims?.["two_factor_enabled"] ||
          sessionClaims?.["mfa"],
        );

        if (!hasMFA) {
          const url = req.nextUrl.clone();
          url.pathname = "/mfa-setup";
          url.searchParams.set("redirect_url", pathname);

          const response = NextResponse.redirect(url);
          const isStrict = STRICT_ROUTES(req);
          response.headers.set(
            "Content-Security-Policy",
            isStrict ? CSP_STRICT : CSP_PUBLIC,
          );
          response.headers.set(
            "X-Frame-Options",
            isStrict ? "DENY" : "SAMEORIGIN",
          );
          return response;
        }
      }
    }
  }

  // All other routes - return response with headers
  return createResponseWithHeaders(req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
