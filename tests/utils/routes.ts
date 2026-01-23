/**
 * Route definitions for security header tests
 * Ensures public tests can't test private routes and vice versa
 */

export const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/pricing",
  "/about",
  "/terms",
  "/privacy",
  "/maintenance",
  "/onboarding",
  "/mfa-setup",
  "/complete-profile",
] as const;

export const PRIVATE_ROUTES = [
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
  "/dashboard",
  "/account",
  "/accounts",
  "/transactions",
  "/cash-flow",
  "/insights",
  "/alerts",
  "/ai-worker",
  "/compliance",
  "/certifications",
  "/financial-reports",
  "/admin",
  "/upload",
  "/properties",
  "/units",
  "/tenants",
  "/leases",
  "/rent-collection",
  "/dcaa",
  "/invoices",
  "/bills",
  "/vendors",
  "/diagnostics",
] as const;

/**
 * Assert that a route is public. Throws if route is private or unknown.
 * Use in public test files to prevent accidentally testing private routes.
 */
export function assertPublicRoute(route: string): void {
  const isPublic = PUBLIC_ROUTES.some(
    (r) => route === r || route.startsWith(r + "/"),
  );
  const isPrivate = PRIVATE_ROUTES.some(
    (r) => route === r || route.startsWith(r + "/"),
  );

  if (isPrivate) {
    throw new Error(
      `Route "${route}" is a PRIVATE route. Use tests/auth/ for private route tests.`,
    );
  }
  if (!isPublic) {
    throw new Error(
      `Route "${route}" is not in PUBLIC_ROUTES. Add it to tests/utils/routes.ts`,
    );
  }
}

/**
 * Assert that a route is private. Throws if route is public or unknown.
 * Use in authenticated test files to prevent accidentally testing public routes.
 */
export function assertPrivateRoute(route: string): void {
  const isPublic = PUBLIC_ROUTES.some(
    (r) => route === r || route.startsWith(r + "/"),
  );
  const isPrivate = PRIVATE_ROUTES.some(
    (r) => route === r || route.startsWith(r + "/"),
  );

  if (isPublic) {
    throw new Error(
      `Route "${route}" is a PUBLIC route. Use tests/security-headers.spec.ts for public route tests.`,
    );
  }
  if (!isPrivate) {
    throw new Error(
      `Route "${route}" is not in PRIVATE_ROUTES. Add it to tests/utils/routes.ts`,
    );
  }
}
