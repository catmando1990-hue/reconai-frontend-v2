import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_STORAGE_STATE = "playwright/.clerk/user.json";

/**
 * Wait for an input to be ready (visible + enabled) and fill it.
 * Clerk disables inputs during React hydration and may re-render/detach DOM nodes.
 * Using expect().toBeEnabled() with Playwright's retry mechanism handles both:
 * 1. Initial disabled state during hydration
 * 2. DOM detachment during re-renders (assertion auto-retries with fresh locators)
 */
async function waitAndFillInput(
  page: import("@playwright/test").Page,
  selectors: string[],
  value: string,
  timeoutMs = 10000,
): Promise<boolean> {
  for (const selector of selectors) {
    try {
      const loc = page.locator(selector).first();
      // Check if element exists at all
      const count = await loc.count();
      if (count === 0) continue;

      // Use expect().toBeEnabled() which retries through DOM mutations
      // This handles Clerk's hydration where elements are detached/reattached
      await expect(loc).toBeEnabled({ timeout: timeoutMs });
      await loc.fill(value);
      return true;
    } catch {
      // Selector not found or not enabled within timeout, try next
      continue;
    }
  }
  return false;
}

/**
 * Wait for a button to be visible and click it.
 * Buttons typically don't have the same hydration issues as inputs.
 */
async function waitAndClickButton(
  page: import("@playwright/test").Page,
  selectors: string[],
  timeoutMs = 5000,
): Promise<boolean> {
  for (const selector of selectors) {
    try {
      const loc = page.locator(selector).first();
      const count = await loc.count();
      if (count === 0) continue;

      await expect(loc).toBeVisible({ timeout: timeoutMs });
      await loc.click();
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

setup("auth: seed Clerk browser session", async ({ page, baseURL }) => {
  const email =
    process.env.E2E_CLERK_USER_EMAIL || process.env.E2E_CLERK_USER_USERNAME;
  const password = process.env.E2E_CLERK_USER_PASSWORD;
  if (!email) {
    throw new Error(
      "Missing required env var: E2E_CLERK_USER_EMAIL (or E2E_CLERK_USER_USERNAME).",
    );
  }
  if (!password) {
    throw new Error("Missing required env var: E2E_CLERK_USER_PASSWORD.");
  }

  if (!baseURL) {
    throw new Error(
      "Playwright baseURL is not set. Provide PLAYWRIGHT_BASE_URL or BASE_URL.",
    );
  }

  const outDir = path.dirname(AUTH_STORAGE_STATE);
  fs.mkdirSync(outDir, { recursive: true });

  // Start on the sign-in page.
  await page.goto(`${baseURL}/sign-in`, { waitUntil: "domcontentloaded" });

  // Clerk can render slightly different flows depending on settings.
  // This loop handles common variants: (email -> password) or combined form.
  for (let step = 0; step < 8; step++) {
    const onSignIn = page.url().includes("/sign-in");
    if (!onSignIn) break;

    // 1) Ensure email/identifier is filled when editable (waits for Clerk hydration).
    await waitAndFillInput(
      page,
      [
        'input[name="identifier"]',
        'input[name="emailAddress"]',
        'input[type="email"]',
        'input[autocomplete="email"]',
      ],
      email,
    );

    // 2) If password field is editable, fill it.
    const passwordFilled = await waitAndFillInput(
      page,
      ['input[name="password"]', 'input[type="password"]'],
      password,
    );

    // 3) Submit/continue.
    const clicked = await waitAndClickButton(page, [
      'button[type="submit"]',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
    ]);

    if (!clicked) {
      // If nothing clickable, give Clerk a tick to render.
      await page.waitForTimeout(500);
    }

    // If password was just filled and submitted, wait for navigation.
    if (passwordFilled) {
      try {
        await page.waitForURL((url) => !url.toString().includes("/sign-in"), {
          timeout: 60_000,
        });
        break;
      } catch {
        // Continue loop to handle MFA / interstitials if present.
      }
    }
  }

  // If your app redirects post-auth, force a protected route to validate session.
  await page.goto(`${baseURL}/home`, { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/sign-in/);

  await page.context().storageState({ path: AUTH_STORAGE_STATE });
});
