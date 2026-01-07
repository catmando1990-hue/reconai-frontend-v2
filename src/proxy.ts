import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Next.js 16: proxy.ts replaces middleware.ts.
 * Clerk middleware MUST run for routes that call `auth()` / `currentUser()` or use Clerk components.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Match all routes except Next internals and static files
    "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|map)$).*)",
    // Always run on API routes
    "/api/(.*)",
  ],
};
