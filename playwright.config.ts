import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration
 *
 * Environment variables:
 * - PLAYWRIGHT_BASE_URL: Primary override for baseURL (CI uses this)
 * - BASE_URL: Fallback if PLAYWRIGHT_BASE_URL not set
 * - PLAYWRIGHT_AUTH: When 'true', load authenticated storage state
 * - Default: http://localhost:3000 (local dev only)
 *
 * In CI: Set PLAYWRIGHT_BASE_URL=https://www.reconaitechnology.com
 * Locally: No env var needed, defaults to localhost:3000
 *
 * Authenticated CI lane:
 * - Set PLAYWRIGHT_AUTH=true to enable authenticated tests
 * - Requires playwright-auth-state.json (created by seed-playwright-auth.ts)
 */

// Determine if running against a remote URL (CI mode)
const isRemote = Boolean(
  process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL,
);

// Determine if running in authenticated mode
const isAuthenticated = process.env.PLAYWRIGHT_AUTH === "true";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000";

// Log configuration for debugging in CI
console.log(`[Playwright] baseURL: ${baseURL} (isRemote: ${isRemote}, isAuth: ${isAuthenticated})`);

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 1,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    // Load authenticated storage state when PLAYWRIGHT_AUTH=true
    ...(isAuthenticated ? { storageState: "playwright-auth-state.json" } : {}),
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["iPhone 12"],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["iPad (gen 7)"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  // Only start local dev server when NOT running against a remote URL
  ...(!isRemote
    ? {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }
    : {}),
});
