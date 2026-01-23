import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_STORAGE_STATE = "playwright/.clerk/user.json";

async function isVisible(
  locator: ReturnType<import("@playwright/test").Page["locator"]>,
  timeoutMs = 1500,
) {
  try {
    return await locator.first().isVisible({ timeout: timeoutMs });
  } catch {
    return false;
  }
}

async function fillFirstVisible(
  page: import("@playwright/test").Page,
  selectors: string[],
  value: string,
): Promise<boolean> {
  for (const selector of selectors) {
    const loc = page.locator(selector);
    if (await isVisible(loc)) {
      await loc.first().fill(value);
      return true;
    }
  }
  return false;
}

async function clickFirstVisible(
  page: import("@playwright/test").Page,
  selectors: string[],
): Promise<boolean> {
  for (const selector of selectors) {
    const loc = page.locator(selector);
    if (await isVisible(loc)) {
      await loc.first().click();
      return true;
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

    // 1) Ensure email/identifier is filled when visible.
    await fillFirstVisible(
      page,
      [
        'input[name="identifier"]',
        'input[name="emailAddress"]',
        'input[type="email"]',
        'input[autocomplete="email"]',
      ],
      email,
    );

    // 2) If password field is visible, fill it.
    const passwordFilled = await fillFirstVisible(
      page,
      ['input[name="password"]', 'input[type="password"]'],
      password,
    );

    // 3) Submit/continue.
    const clicked = await clickFirstVisible(page, [
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
