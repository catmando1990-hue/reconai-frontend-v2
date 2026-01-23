import { test, expect } from "@playwright/test";
import { assertPrivateRoute } from "../utils/routes";

/**
 * Security Headers Tests - Dashboard Pages (Authenticated)
 *
 * These tests validate STRICT headers on PRIVATE routes only.
 * Dashboard pages use strict CSP (frame-ancestors 'none', X-Frame-Options: DENY)
 *
 * For public routes, see tests/security-headers.spec.ts
 *
 * Runs with authentication via ci-auth project.
 */

test.describe("Security Headers - Dashboard Pages", () => {
  test("dashboard /home has strict CSP (frame-ancestors none)", async ({
    page,
  }) => {
    const route = "/home";
    assertPrivateRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("frame-ancestors 'self'");
  });

  test("dashboard /core has strict CSP", async ({ page }) => {
    const route = "/core";
    assertPrivateRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test("dashboard /settings has strict CSP", async ({ page }) => {
    const route = "/settings";
    assertPrivateRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test("dashboard pages have X-Frame-Options DENY", async ({ page }) => {
    const route = "/home";
    assertPrivateRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const xfo = response!.headers()["x-frame-options"];
    expect(xfo).toBe("DENY");
  });

  test("dashboard pages have required security headers", async ({ page }) => {
    const route = "/home";
    assertPrivateRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const headers = response!.headers();

    // HSTS
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["strict-transport-security"]).toContain("includeSubDomains");

    // X-Content-Type-Options
    expect(headers["x-content-type-options"]).toBe("nosniff");

    // Referrer-Policy
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

    // Permissions-Policy
    expect(headers["permissions-policy"]).toBeDefined();
  });
});
