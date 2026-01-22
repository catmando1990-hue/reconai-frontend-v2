/**
 * CI Smoke Test Fixtures — Canonical Auth Decoupling
 *
 * CANONICAL RULE: Smoke tests must NEVER reference auth artifacts.
 *
 * This fixture ensures fresh unauthenticated browser contexts for all
 * CI smoke tests, regardless of global Playwright config or env vars.
 */
import { test as base } from "@playwright/test";

export const test = base.extend({
  context: async ({ browser }, use) => {
    // CANONICAL: No storageState - always fresh unauthenticated context
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
});

export { expect } from "@playwright/test";
