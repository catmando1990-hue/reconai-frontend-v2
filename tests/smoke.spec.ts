import { test, expect } from "@playwright/test";

// Core routes smoke tests - run at all viewports (mobile, tablet, desktop)

test.describe("Core Pages", () => {
  test("homepage loads without horizontal scroll", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ReconAI/i);

    // Verify no horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    // Page should load without error
    await expect(page.locator("body")).toBeVisible();
  });

  test("dashboard redirects to sign-in when logged out", async ({ page }) => {
    await page.goto("/dashboard");
    // Clerk routes can vary; assert we end up on sign-in route
    await expect(page).toHaveURL(/sign-in|sign_up|sign-up/i);
  });

  test("connect-bank redirects to sign-in when logged out", async ({
    page,
  }) => {
    await page.goto("/connect-bank");
    await expect(page).toHaveURL(/sign-in|sign_up|sign-up/i);
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("h1")).toContainText(/Terms of Service/i);

    // Verify no horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText(/Privacy Policy/i);

    // Verify no horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("maintenance page loads", async ({ page }) => {
    await page.goto("/maintenance");
    await expect(page.locator("h1")).toContainText(/Maintenance/i);
  });
});

test.describe("Marketing Pages", () => {
  test("platform page loads without horizontal scroll", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("h1")).toBeVisible();

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test("how-it-works page loads", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(page.locator("body")).toBeVisible();
  });

  test("packages page loads", async ({ page }) => {
    await page.goto("/packages");
    await expect(page.locator("body")).toBeVisible();
  });

  test("security page loads", async ({ page }) => {
    await page.goto("/security");
    await expect(page.locator("body")).toBeVisible();
  });
});
