import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { has, get } from "@vercel/edge-config";

/**
 * Next.js 16 uses `src/proxy.ts` instead of middleware.ts.
 *
 * Phase 15:
 * - Keep marketing landing `/` public and untouched.
 * - Protect `/dashboard/*`, `/onboarding/*`, `/api/*`.
 * - Onboarding gate only applies to `/dashboard/*`.
 * - Treat user as onboarded if either:
 *    publicMetadata.onboarded === true
 *    OR unsafeMetadata.onboardingComplete === true (legacy)
 *
 * Phase 16 (Maintenance Mode):
 * - Admin-only bypass using Clerk role: `admin`
 * - Edge Config toggles maintenance_mode
 * - Non-admin users redirected to /maintenance
 *
 * Phase CSP:
 * - Sets Content-Security-Policy headers
 * - Fixes Clerk blob worker CSP violation with `worker-src 'self' blob:`
 */

/**
 * Build CSP header value.
 * - Fixes Clerk blob worker CSP violation by setting `worker-src 'self' blob:`
 * - Keeps compatibility directives (unsafe-inline/unsafe-eval) for now
 */
function buildCsp() {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],

    // Images / media
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "media-src": ["'self'", "blob:", "https:"],
    "font-src": ["'self'", "data:", "https:"],

    // Styles
    "style-src": ["'self'", "'unsafe-inline'"],

    // Scripts (compat mode for now)
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://*.clerk.accounts.dev",
      "https://*.clerk.dev",
      "https://clerk.reconaitechnology.com",
      "https://challenges.cloudflare.com",
      "https://vercel.live",
    ],

    // Critical fix for Clerk: allow blob workers
    "worker-src": ["'self'", "blob:"],

    // If Clerk uses iframes for challenges, allow them explicitly
    "frame-src": [
      "'self'",
      "https://*.clerk.accounts.dev",
      "https://*.clerk.dev",
      "https://clerk.reconaitechnology.com",
      "https://challenges.cloudflare.com",
    ],

    // Network calls
    "connect-src": [
      "'self'",
      "https://*.clerk.accounts.dev",
      "https://*.clerk.dev",
      "https://clerk.reconaitechnology.com",
      "https://vercel.live",
      "https://*.vercel-storage.com",
      "https://reconai-backend.onrender.com",
    ],

    // Optional hardening
    "form-action": ["'self'"],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : `${k}`))
    .join("; ");
}

/**
 * Apply security headers to a response.
 */
function applySecurityHeaders(res: NextResponse) {
  res.headers.set("Content-Security-Policy", buildCsp());
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  return res;
}

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/api(.*)",
]);

function isTruthy(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Check maintenance mode from Edge Config (only if key exists)
  const hasMaintenanceKey = await has("maintenance_mode");
  const maintenance = hasMaintenanceKey
    ? await get<boolean>("maintenance_mode")
    : false;

  if (maintenance) {
    const session = await auth();
    const claims = session.sessionClaims as Record<string, unknown> | null;
    const publicMetadata = claims?.publicMetadata as
      | Record<string, unknown>
      | undefined;
    const role = publicMetadata?.role as string | undefined;
    const isAdmin = role === "admin";
    const isMaintenancePage =
      pathname === "/maintenance" || pathname.startsWith("/maintenance/");
    const isAdminRoute = pathname.startsWith("/admin");

    // Redirect non-admins to maintenance page (except admin routes and maintenance page itself)
    if (!isAdmin && !isMaintenancePage && !isAdminRoute) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      const redirectRes = NextResponse.redirect(url);
      return applySecurityHeaders(redirectRes);
    }
  }

  // Marketing landing is always public.
  if (pathname === "/") return applySecurityHeaders(NextResponse.next());

  // Non-protected route: no-op.
  if (!isProtectedRoute(req)) return applySecurityHeaders(NextResponse.next());

  // Require authentication on protected routes.
  await auth.protect();

  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isOnboarding =
    pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  // Only gate onboarding when entering dashboard routes.
  if (isDashboard && !isOnboarding) {
    const session = await auth();
    const claims = session.sessionClaims as Record<string, unknown> | null;

    const publicMetadata = claims?.publicMetadata as
      | Record<string, unknown>
      | undefined;
    const metadata = claims?.metadata as Record<string, unknown> | undefined;
    const unsafeMetadata = claims?.unsafeMetadata as
      | Record<string, unknown>
      | undefined;
    const user = claims?.user as Record<string, unknown> | undefined;
    const userUnsafeMetadata = user?.unsafeMetadata as
      | Record<string, unknown>
      | undefined;

    // Preferred: publicMetadata.onboarded
    const publicOnboarded =
      isTruthy(publicMetadata?.onboarded) || isTruthy(metadata?.onboarded);

    // Legacy: unsafeMetadata.onboardingComplete (client-settable)
    const legacyOnboardingComplete =
      isTruthy(unsafeMetadata?.onboardingComplete) ||
      isTruthy(unsafeMetadata?.onboarded) ||
      isTruthy(userUnsafeMetadata?.onboardingComplete);

    // Cookie fallback (unsafeMetadata isn't in JWT by default)
    const cookieOnboarded =
      req.cookies.get("onboarding_complete")?.value === "true";

    const onboarded =
      publicOnboarded || legacyOnboardingComplete || cookieOnboarded;

    if (!onboarded) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      const redirectRes = NextResponse.redirect(url);
      return applySecurityHeaders(redirectRes);
    }
  }

  return applySecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    // Match all routes except Next internals and static files
    "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|map)$).*)",
    // Always run on API routes
    "/api/(.*)",
  ],
};
