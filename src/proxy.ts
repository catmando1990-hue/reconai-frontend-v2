import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Next.js 16 uses `src/proxy.ts` instead of middleware.ts.
 *
 * Phase 7 Fix:
 * - Never redirect the marketing landing page (`/`).
 * - Protect dashboard + onboarding routes only.
 * - Only gate onboarding when a signed-in user enters the dashboard and is not marked onboarded.
 */

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Always allow marketing landing (and other public marketing pages) through untouched.
  if (pathname === "/") return NextResponse.next();

  // If this is not a protected route, do nothing.
  if (!isProtectedRoute(req)) return NextResponse.next();

  // Require authentication on protected routes.
  await auth.protect();

  // Onboarding gate: only for dashboard entry (never for marketing routes)
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  if (isDashboard && !isOnboarding) {
    const session = await auth();
    const claims = session.sessionClaims as Record<string, unknown> | null;

    // Convention: user is onboarded when publicMetadata.onboarded === true
    const publicMetadata = claims?.publicMetadata as Record<string, unknown> | undefined;
    const metadata = claims?.metadata as Record<string, unknown> | undefined;

    const onboarded =
      publicMetadata?.onboarded === true ||
      publicMetadata?.onboarded === "true" ||
      metadata?.onboarded === true ||
      metadata?.onboarded === "true";

    if (!onboarded) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding/org";
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
