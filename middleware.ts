import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

// Routes that require a signed-in user
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/upload(.*)',
  '/transactions(.*)',
  '/settings(.*)',
  '/app(.*)',
]);

// Routes that require an active organization context
const isOrgRequiredRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/upload(.*)',
  '/transactions(.*)',
  '/settings(.*)',
  '/app(.*)',
]);

export default clerkEnabled
  ? clerkMiddleware(async (auth, req) => {
      // Require sign-in for protected routes
      if (isProtectedRoute(req)) {
        const { userId, redirectToSignIn } = await auth();

        if (!userId) {
          return redirectToSignIn({ returnBackUrl: req.url });
        }
      }

      // If signed in but no active org, redirect to org onboarding
      if (isOrgRequiredRoute(req)) {
        const { userId, orgId } = await auth();

        if (userId && !orgId) {
          const url = new URL('/onboarding/org', req.url);
          url.searchParams.set('returnTo', req.nextUrl.pathname + req.nextUrl.search);
          return NextResponse.redirect(url);
        }
      }

      return NextResponse.next();
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    // Run middleware on all routes except Next.js internals and static files
    '/((?!_next|.*\\..*).*)',
    '/api/(.*)',
  ],
};
