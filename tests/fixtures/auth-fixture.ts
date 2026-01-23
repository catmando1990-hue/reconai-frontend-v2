import { test as base } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Auth-Aware Test Fixture
 *
 * Extends Playwright's base test to automatically skip when authentication
 * state is not available. This prevents ci-auth tests from running and failing
 * when playwright-auth-state.json was not seeded.
 *
 * USAGE:
 * Replace `import { test, expect } from "@playwright/test"`
 * With    `import { test, expect } from "../fixtures/auth-fixture"`
 *
 * HOW IT WORKS:
 * - Checks if AUTH_STORAGE_STATE file exists and contains valid cookies
 * - If auth is invalid, skips the test with a descriptive message
 * - If auth is valid, test proceeds normally
 *
 * This allows forks/PRs without secrets to pass CI (tests skip cleanly)
 * while authenticated tests run normally when secrets are available.
 */

const AUTH_STORAGE_STATE = "playwright/.clerk/user.json";

function hasValidAuthState(): boolean {
  const statePath = path.resolve(AUTH_STORAGE_STATE);

  if (!fs.existsSync(statePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(statePath, "utf-8");
    const state = JSON.parse(content);

    // Check if cookies array exists and has at least one cookie
    // Empty state (from skipped auth setup) has { cookies: [], origins: [] }
    if (!state.cookies || !Array.isArray(state.cookies)) {
      return false;
    }

    // Clerk session requires __session or __client cookies
    const hasClerkSession = state.cookies.some(
      (c: { name: string }) =>
        c.name === "__session" ||
        c.name === "__client" ||
        c.name.startsWith("__clerk"),
    );

    return hasClerkSession;
  } catch {
    return false;
  }
}

// Cache the auth state check (only needs to run once per test run)
let authStateValid: boolean | null = null;

function checkAuthState(): boolean {
  if (authStateValid === null) {
    authStateValid = hasValidAuthState();
  }
  return authStateValid;
}

/**
 * Extended test that auto-skips when auth state is invalid.
 *
 * Use this in all tests under tests/auth/*.spec.ts
 */
export const test = base.extend<object>({
  // eslint-disable-next-line no-empty-pattern
  page: async ({ page }, use) => {
    if (!checkAuthState()) {
      test.skip(
        true,
        "Auth state not available. Skipping authenticated test. " +
          "To run: node scripts/seed-playwright-auth.mjs",
      );
    }
    await use(page);
  },
});

export { expect } from "@playwright/test";
