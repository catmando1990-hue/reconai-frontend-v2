import type { Page } from "@playwright/test";

/**
 * Fail-Fast Auth Redirect Check
 *
 * Call this after navigating to any protected route.
 * Throws immediately if the page redirected to sign-in,
 * surfacing auth issues instead of letting tests hang or timeout.
 */
export function assertNoAuthRedirect(page: Page): void {
  const url = page.url();
  if (url.includes("/sign-in")) {
    throw new Error(
      `AUTH REDIRECT DETECTED: Expected protected route but got redirected to sign-in.\n` +
        `Current URL: ${url}\n` +
        `This indicates the test session is not authenticated.\n` +
        `For CI: Ensure PLAYWRIGHT_AUTH=true and auth state is seeded.`,
    );
  }
}

/**
 * Navigate to protected route with fail-fast auth check.
 * Combines goto + auth redirect assertion in one call.
 */
export async function gotoProtectedRoute(
  page: Page,
  path: string,
): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  assertNoAuthRedirect(page);
}
