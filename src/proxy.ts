import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
 */

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

  // Marketing landing is always public.
  if (pathname === "/") return NextResponse.next();

  // Non-protected route: no-op.
  if (!isProtectedRoute(req)) return NextResponse.next();

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
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except Next internals and static files
    "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|map)$).*)",
    // Always run on API routes
    "/api/(.*)",
  ],
};
