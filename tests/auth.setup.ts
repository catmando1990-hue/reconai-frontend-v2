import { test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Auth Setup - ZERO UI INTERACTION
 *
 * This setup does NOT perform UI-based login. Clerk inputs are disabled during
 * hydration, making UI automation nondeterministic.
 *
 * Instead, auth state must be pre-seeded by scripts/seed-playwright-auth.mjs
 * which uses the Clerk backend SDK to create a valid session.
 *
 * LIFECYCLE:
 * - If SEEDED_AUTH_STATE exists → copy to AUTH_STORAGE_STATE → tests run authenticated
 * - If SEEDED_AUTH_STATE missing → skip setup → ci-auth tests will be skipped
 *
 * FAIL-CLOSED:
 * - No UI fallback
 * - No credentials in this file
 * - Missing auth state = skip, not failure (allows forks/PRs without secrets)
 */

const SEEDED_AUTH_STATE = "playwright-auth-state.json";
const AUTH_STORAGE_STATE = "playwright/.clerk/user.json";

setup("auth: load pre-seeded Clerk session", async () => {
  const seededPath = path.resolve(SEEDED_AUTH_STATE);
  const outputPath = path.resolve(AUTH_STORAGE_STATE);
  const outputDir = path.dirname(outputPath);

  // Check if seeded auth state exists
  if (!fs.existsSync(seededPath)) {
    // SKIP: Auth state not seeded (fork/PR without secrets, or local dev without seeding)
    console.log(
      `[auth.setup] SKIP: ${SEEDED_AUTH_STATE} not found. Auth tests will be skipped.`,
    );
    console.log(
      "[auth.setup] To seed auth state, run: node scripts/seed-playwright-auth.mjs",
    );

    // Create empty storage state so Playwright doesn't fail
    // Tests depending on auth will fail their own assertions if not authenticated
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ cookies: [], origins: [] }, null, 2),
    );

    setup.skip();
    return;
  }

  // Copy seeded auth state to expected location
  console.log(`[auth.setup] Loading pre-seeded auth state from ${seededPath}`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.copyFileSync(seededPath, outputPath);

  console.log(`[auth.setup] Auth state copied to ${outputPath}`);
  console.log("[auth.setup] SUCCESS: Authenticated session ready");
});
