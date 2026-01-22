import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration — Canonical Project Isolation
 *
 * Environment variables:
 * - PLAYWRIGHT_BASE_URL: Primary override for baseURL (CI uses this)
 * - BASE_URL: Fallback if PLAYWRIGHT_BASE_URL not set
 * - Default: http://localhost:3000 (local dev only)
 *
 * In CI: Set PLAYWRIGHT_BASE_URL=https://www.reconaitechnology.com
 * Locally: No env var needed, defaults to localhost:3000
 *
 * CANONICAL AUTH RULE:
 * - Auth is NEVER configured globally
 * - ci-smoke: always unauthenticated (no storageState)
 * - ci-auth: explicitly loads playwright-auth-state.json
 */

// Determine if running against a remote URL (CI mode)
const isRemote = Boolean(
  process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL,
);

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000";

// Log configuration for debugging in CI
console.log(`[Playwright] baseURL: ${baseURL} (isRemote: ${isRemote})`);

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 1,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    // CANONICAL: No global storageState - auth is project-specific
  },
  projects: [
    // CI-only: fast, deterministic smoke tests (<3 min total)
    // CANONICAL: ci-smoke is ALWAYS unauthenticated
    {
      name: "ci-smoke",
      testDir: "./tests/ci",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: undefined, // EXPLICIT: no auth artifacts
      },
    },
    // CI-only: authenticated E2E tests
    // CANONICAL: ci-auth ALWAYS requires playwright-auth-state.json
    {
      name: "ci-auth",
      testDir: "./tests/auth",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: "playwright-auth-state.json", // EXPLICIT: auth required
      },
    },
    // Full regression: all tests, all viewports (manual/nightly)
    {
      name: "full-regression",
      testDir: "./tests",
      testIgnore: ["**/ci/**"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      testDir: "./tests",
      testIgnore: ["**/ci/**"],
      use: {
        ...devices["iPhone 12"],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "tablet",
      testDir: "./tests",
      testIgnore: ["**/ci/**"],
      use: {
        ...devices["iPad (gen 7)"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "desktop",
      testDir: "./tests",
      testIgnore: ["**/ci/**"],
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
