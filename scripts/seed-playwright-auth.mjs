#!/usr/bin/env node
/**
 * Seed authenticated Playwright storage state using Clerk backend SDK.
 *
 * LIFECYCLE STATES:
 * - FAIL: Missing CLERK_SECRET_KEY or PLAYWRIGHT_BASE_URL (required secrets)
 * - SKIP: Missing CLERK_CI_USER_ID (auth seeding is optional on forks/PRs)
 * - SUCCESS: Auth state seeded successfully
 *
 * SECURITY:
 * - Uses Clerk backend SDK (not UI automation)
 * - Requires CLERK_SECRET_KEY and CLERK_CI_USER_ID from GitHub Secrets
 * - Creates short-lived session for dedicated CI user
 * - FAIL-CLOSED: throws on any error
 *
 * USAGE (CI only):
 *   npm install -D @clerk/clerk-sdk-node
 *   CLERK_SECRET_KEY=sk_xxx CLERK_CI_USER_ID=user_xxx PLAYWRIGHT_BASE_URL=https://... node scripts/seed-playwright-auth.mjs
 *
 * NOTE: @clerk/clerk-sdk-node is installed at CI runtime, not in package.json.
 * This keeps the dependency out of the production bundle.
 */
import * as fs from "fs";
import * as path from "path";

// Fail-closed helper
function fatal(msg) {
  console.error(`[seed-playwright-auth] FATAL: ${msg}`);
  process.exit(1);
}

// Environment validation - FAIL-CLOSED for required secrets
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_CI_USER_ID = process.env.CLERK_CI_USER_ID;
const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL;

if (!CLERK_SECRET_KEY) fatal("Missing CLERK_SECRET_KEY");
if (!PLAYWRIGHT_BASE_URL) fatal("Missing PLAYWRIGHT_BASE_URL");

// Explicit lifecycle: auth seeding is optional but gated
// Allows CI to pass on forks/PRs where CLERK_CI_USER_ID is not available
if (!CLERK_CI_USER_ID) {
  console.log("[seed-playwright-auth] SKIP: CLERK_CI_USER_ID not set");
  process.exit(0);
}

// Dynamic import to handle package not installed
// The package is installed at CI runtime via: npm install -D @clerk/clerk-sdk-node
async function getClerkClient() {
  try {
    const clerkSdk = await import("@clerk/clerk-sdk-node");
    return clerkSdk.createClerkClient({ secretKey: CLERK_SECRET_KEY });
  } catch {
    fatal("@clerk/clerk-sdk-node not installed. Run: npm install -D @clerk/clerk-sdk-node");
  }
}

async function run() {
  console.log("[seed-playwright-auth] Seeding auth state...");
  console.log("[seed-playwright-auth] Target URL:", PLAYWRIGHT_BASE_URL);
  console.log("[seed-playwright-auth] CI User ID:", CLERK_CI_USER_ID);

  const clerk = await getClerkClient();

  console.log("[seed-playwright-auth] Checking for existing sessions...");

  let sessionToken;

  try {
    // Create a sign-in token for the CI user
    // This is the recommended approach for backend-initiated auth
    console.log("[seed-playwright-auth] Creating sign-in token...");

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: CLERK_CI_USER_ID,
      expiresInSeconds: 600, // 10 minutes
    });

    if (!signInToken || !signInToken.token) {
      throw new Error("Failed to create sign-in token - empty response");
    }

    sessionToken = signInToken.token;
    console.log("[seed-playwright-auth] Sign-in token created successfully");
  } catch (err) {
    fatal(`Failed to create Clerk session: ${err.message}`);
  }

  // Determine domain from target URL
  const url = new URL(PLAYWRIGHT_BASE_URL);
  const domain = url.hostname;
  const isSecure = url.protocol === "https:";
  const expiresTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  // Build Playwright storage state
  // Clerk uses __session and __clerk_db_jwt cookies for authentication
  const storageState = {
    cookies: [
      {
        name: "__session",
        value: sessionToken,
        domain: domain,
        path: "/",
        httpOnly: true,
        secure: isSecure,
        sameSite: "Lax",
        expires: expiresTimestamp,
      },
      {
        name: "__clerk_db_jwt",
        value: sessionToken,
        domain: domain,
        path: "/",
        httpOnly: false,
        secure: isSecure,
        sameSite: "Lax",
        expires: expiresTimestamp,
      },
    ],
    origins: [
      {
        origin: PLAYWRIGHT_BASE_URL,
        localStorage: [],
      },
    ],
  };

  // Write storage state file
  const outPath = path.resolve("playwright-auth-state.json");
  fs.writeFileSync(outPath, JSON.stringify(storageState, null, 2));

  console.log("[seed-playwright-auth] Auth storage state written:", outPath);
  console.log("[seed-playwright-auth] Domain:", domain);
  console.log("[seed-playwright-auth] Secure:", isSecure);
  console.log("[seed-playwright-auth] SUCCESS");
}

run().catch((err) => {
  fatal(`Unexpected error: ${err.message || err}`);
});
