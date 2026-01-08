import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ReconAI/i);
});

test("dashboard redirects to sign-in when logged out", async ({ page }) => {
  await page.goto("/dashboard");
  // Clerk routes can vary; assert we end up on sign-in route.
  await expect(page).toHaveURL(/sign-in|sign_up|sign-up/i);
});

test("maintenance page loads", async ({ page }) => {
  await page.goto("/maintenance");
  await expect(page.locator("h1")).toContainText(/Maintenance/i);
});
