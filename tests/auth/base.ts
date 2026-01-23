// tests/auth/base.ts
// Canonical authenticated test base (opt-in only)
import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: "playwright-auth-state.json",
    });
    await use(context);
    await context.close();
  },
});

export { expect };
