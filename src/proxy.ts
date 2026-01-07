import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Next.js 16 uses `src/proxy.ts` instead of middleware.ts.
 *
 * IMPORTANT:
 * - Public routes should NOT redirect to /sign-in.
 * - Only protect dashboard + API routes.
 */

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Match all routes except Next internals and static files
    "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|map)$).*)",
    // Always run on API routes
    "/api/(.*)",
  ],
};
