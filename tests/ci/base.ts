// tests/ci/base.ts
// Canonical unauthenticated test base for CI smoke
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  context: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
});

export { expect };
