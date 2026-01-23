import { test, expect } from "@playwright/test";
import { assertPublicRoute } from "./utils/routes";

/**
 * Security Headers Tests - Public Pages
 *
 * These tests validate headers on PUBLIC routes only.
 * Public pages use moderate CSP (frame-ancestors 'self', X-Frame-Options: SAMEORIGIN)
 *
 * For dashboard/private routes, see tests/auth/security-headers.spec.ts
 */

test.describe("Security Headers - Public Pages", () => {
  test("homepage has moderate CSP (not strict)", async ({ page }) => {
    const route = "/";
    assertPublicRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).not.toContain("frame-ancestors 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  test("sign-in page has moderate CSP", async ({ page }) => {
    const route = "/sign-in";
    assertPublicRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).not.toContain("frame-ancestors 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  test("public pages have X-Frame-Options SAMEORIGIN", async ({ page }) => {
    const route = "/";
    assertPublicRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const xfo = response!.headers()["x-frame-options"];
    expect(xfo).toBe("SAMEORIGIN");
  });

  test("public pages have required security headers", async ({ page }) => {
    const route = "/";
    assertPublicRoute(route);

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

test.describe("Security Headers - CSP Directives", () => {
  test("CSP blocks object-src", async ({ page }) => {
    const route = "/";
    assertPublicRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toContain("object-src 'none'");
  });

  test("CSP has base-uri restriction", async ({ page }) => {
    const route = "/";
    assertPublicRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toContain("base-uri 'self'");
  });

  test("CSP has form-action restriction", async ({ page }) => {
    const route = "/";
    assertPublicRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toContain("form-action 'self'");
  });

  test("CSP upgrades insecure requests", async ({ page }) => {
    const route = "/";
    assertPublicRoute(route);

    const response = await page.goto(route);
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toContain("upgrade-insecure-requests");
  });
});
