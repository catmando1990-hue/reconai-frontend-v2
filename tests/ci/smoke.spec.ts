import { test, expect } from "@playwright/test";

/**
 * CI Smoke Tests
 *
 * CONSTRAINTS:
 * - No external dependencies (no auth, no APIs)
 * - Each test <5s
 * - Deterministic results
 *
 * PURPOSE:
 * Fast validation that the deployment is alive and serving correct responses.
 */

test.describe("CI Smoke - Core", () => {
  test("homepage loads and renders", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/ReconAI/i);
  });

  test("sign-in page loads", async ({ page }) => {
    const response = await page.goto("/sign-in");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    const response = await page.goto("/terms");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toContainText(/Terms/i);
  });

  test("privacy page loads", async ({ page }) => {
    const response = await page.goto("/privacy");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("h1")).toContainText(/Privacy/i);
  });
});

test.describe("CI Smoke - Security Headers", () => {
  test("homepage has CSP header", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const csp = response!.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("frame-ancestors");
  });

  test("homepage has HSTS header", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const hsts = response!.headers()["strict-transport-security"];
    expect(hsts).toBeDefined();
    expect(hsts).toContain("max-age=");
  });

  test("homepage has X-Content-Type-Options", async ({ page }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const xcto = response!.headers()["x-content-type-options"];
    expect(xcto).toBe("nosniff");
  });
});

test.describe("CI Smoke - Protected Routes Redirect", () => {
  test("dashboard redirects to sign-in when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in|sign_up|sign-up/i);
  });
});
