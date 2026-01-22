#!/usr/bin/env npx ts-node
/**
 * Seed authenticated Playwright storage state using Clerk backend SDK.
 *
 * SECURITY:
 * - Uses Clerk backend SDK (not UI automation)
 * - Requires CLERK_SECRET_KEY and CLERK_CI_USER_ID from GitHub Secrets
 * - Creates short-lived session for dedicated CI user
 * - FAIL-CLOSED: throws on any error
 *
 * USAGE (CI only):
 *   npm install -D @clerk/clerk-sdk-node
 *   CLERK_SECRET_KEY=sk_xxx CLERK_CI_USER_ID=user_xxx npx ts-node scripts/seed-playwright-auth.ts
 *
 * NOTE: @clerk/clerk-sdk-node is installed at CI runtime, not in package.json.
 * This keeps the dependency out of the production bundle.
 */
import * as fs from "fs";
import * as path from "path";

// Environment validation - FAIL-CLOSED
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_CI_USER_ID = process.env.CLERK_CI_USER_ID;
const PLAYWRIGHT_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

if (!CLERK_SECRET_KEY) {
  console.error("[seed-playwright-auth] FATAL: Missing CLERK_SECRET_KEY");
  process.exit(1);
}

if (!CLERK_CI_USER_ID) {
  console.error("[seed-playwright-auth] FATAL: Missing CLERK_CI_USER_ID");
  process.exit(1);
}

// Dynamic require to avoid TypeScript errors when package not installed
// The package is installed at CI runtime via: npm install -D @clerk/clerk-sdk-node
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getClerkClient(): Promise<any> {
  try {
    const clerkSdk = await import("@clerk/clerk-sdk-node");
    return clerkSdk.createClerkClient({ secretKey: CLERK_SECRET_KEY! });
  } catch {
    console.error(
      "[seed-playwright-auth] FATAL: @clerk/clerk-sdk-node not installed",
    );
    console.error(
      "[seed-playwright-auth] Run: npm install -D @clerk/clerk-sdk-node",
    );
    process.exit(1);
  }
}

async function run(): Promise<void> {
  console.log("[seed-playwright-auth] Starting Clerk session seeding...");
  console.log("[seed-playwright-auth] Target URL:", PLAYWRIGHT_BASE_URL);
  console.log("[seed-playwright-auth] CI User ID:", CLERK_CI_USER_ID);

  const clerk = await getClerkClient();

  // Try to get an existing active session first
  console.log("[seed-playwright-auth] Checking for existing sessions...");

  let sessionToken: string;

  try {
    // Create a sign-in token for the CI user
    // This is the recommended approach for backend-initiated auth
    console.log("[seed-playwright-auth] Creating sign-in token...");

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: CLERK_CI_USER_ID!,
      expiresInSeconds: 600, // 10 minutes
    });

    if (!signInToken || !signInToken.token) {
      throw new Error("Failed to create sign-in token - empty response");
    }

    sessionToken = signInToken.token;
    console.log("[seed-playwright-auth] Sign-in token created successfully");
  } catch (err) {
    const error = err as Error;
    console.error(
      "[seed-playwright-auth] FATAL: Failed to create Clerk session",
    );
    console.error("[seed-playwright-auth] Error:", error.message);
    process.exit(1);
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
        sameSite: "Lax" as const,
        expires: expiresTimestamp,
      },
      {
        name: "__clerk_db_jwt",
        value: sessionToken,
        domain: domain,
        path: "/",
        httpOnly: false,
        secure: isSecure,
        sameSite: "Lax" as const,
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
  const error = err as Error;
  console.error("[seed-playwright-auth] FATAL ERROR:", error.message || err);
  process.exit(1);
});
