import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration
 *
 * Environment variables:
 * - PLAYWRIGHT_BASE_URL: Primary override for baseURL (CI uses this)
 * - BASE_URL: Fallback if PLAYWRIGHT_BASE_URL not set
 * - Default: http://localhost:3000 (local dev only)
 *
 * In CI: Set PLAYWRIGHT_BASE_URL=https://www.reconaitechnology.com
 * Locally: No env var needed, defaults to localhost:3000
 */

// Determine if running against a remote URL (CI mode)
const isRemote = Boolean(
  process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL,
);

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.BASE_URL ||
  "http://localhost:3000";

// Log baseURL for debugging in CI
console.log(`[Playwright] baseURL: ${baseURL} (isRemote: ${isRemote})`);

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL,
    trace: "retain-on-failure",
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
