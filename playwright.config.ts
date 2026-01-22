import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 1 : 0,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
  },

  projects: [
    {
      name: 'ci-smoke',
      testMatch: /tests\/ci\/.*\.spec\.ts/,
      use: {
        storageState: undefined,
      },
    },
    {
      name: 'ci-auth',
      testMatch: /tests\/auth\/.*\.spec\.ts/,
      use: {
        storageState: 'playwright-auth-state.json',
      },
    },
    {
      name: 'full-regression',
      testMatch: /tests\/.*\.spec\.ts/,
    },
  ],
});
