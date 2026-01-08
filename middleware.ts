// ReconAI — Clerk route protection middleware (production-ready)
// Enterprise-first: no disruptive layout changes; contract-first architecture unaffected.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes (no auth required). Keep minimal for beta.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/terms",
  "/legal(.*)",
  "/packages",
  "/how-it-works",
  "/platform",
  "/security",
  "/support",
  "/onboarding(.*)",
  "/api/health(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    // Protect everything except Next.js internals and static assets
    "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|eot)$).*)",
    // Always run for API routes (if you use Next API routes)
    "/api(.*)",
  ],
};
