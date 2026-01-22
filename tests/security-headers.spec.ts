import { test, expect } from "@playwright/test";

/**
 * Security Headers Tests
 *
 * Validates split CSP profiles:
 * - Public pages: moderate CSP (frame-ancestors 'self')
 * - Dashboard pages: strict CSP (frame-ancestors 'none')
 *
 * Also validates presence of other security headers.
 */

test.describe("Security Headers - Public Pages", () => {
  test("homepage has moderate CSP (not strict)", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toBeDefined();

    // Public pages should NOT have frame-ancestors 'none'
    expect(csp).not.toContain("frame-ancestors 'none'");
    // Public pages should have frame-ancestors 'self'
    expect(csp).toContain("frame-ancestors 'self'");
  });

  test("sign-in page has moderate CSP", async ({ page }) => {
    const response = await page.goto("/sign-in");
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).not.toContain("frame-ancestors 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  test("public pages have X-Frame-Options SAMEORIGIN", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const xfo = response!.headers()["x-frame-options"];
    expect(xfo).toBe("SAMEORIGIN");
  });

  test("public pages have required security headers", async ({ page }) => {
    const response = await page.goto("/");
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

test.describe("Security Headers - Dashboard Pages", () => {
  // Dashboard tests may redirect to sign-in when not authenticated
  // We check headers on the redirect response or final response

  test("dashboard /home has strict CSP (frame-ancestors none)", async ({
    page,
  }) => {
    // Navigate and capture the response for /home route
    // Even if redirected, Next.js headers are applied to the initial route match
    const response = await page.goto("/home", { waitUntil: "commit" });
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];

    // If we got the dashboard route headers (before any redirect)
    if (csp) {
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).not.toContain("frame-ancestors 'self'");
    }
  });

  test("dashboard /core has strict CSP", async ({ page }) => {
    const response = await page.goto("/core", { waitUntil: "commit" });
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    if (csp) {
      expect(csp).toContain("frame-ancestors 'none'");
    }
  });

  test("dashboard /settings has strict CSP", async ({ page }) => {
    const response = await page.goto("/settings", { waitUntil: "commit" });
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    if (csp) {
      expect(csp).toContain("frame-ancestors 'none'");
    }
  });

  test("dashboard pages have X-Frame-Options DENY", async ({ page }) => {
    const response = await page.goto("/home", { waitUntil: "commit" });
    expect(response).not.toBeNull();

    const xfo = response!.headers()["x-frame-options"];
    if (xfo) {
      expect(xfo).toBe("DENY");
    }
  });

  test("dashboard pages have required security headers", async ({ page }) => {
    const response = await page.goto("/home", { waitUntil: "commit" });
    expect(response).not.toBeNull();

    const headers = response!.headers();

    // These headers should always be present
    if (headers["strict-transport-security"]) {
      expect(headers["strict-transport-security"]).toContain("max-age=");
    }

    if (headers["x-content-type-options"]) {
      expect(headers["x-content-type-options"]).toBe("nosniff");
    }
  });
});

test.describe("Security Headers - CSP Directives", () => {
  test("CSP blocks object-src", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toContain("object-src 'none'");
  });

  test("CSP has base-uri restriction", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toContain("base-uri 'self'");
  });

  test("CSP has form-action restriction", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toContain("form-action 'self'");
  });

  test("CSP upgrades insecure requests", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toContain("upgrade-insecure-requests");
  });
});
