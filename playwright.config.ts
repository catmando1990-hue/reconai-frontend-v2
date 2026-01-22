import { defineConfig } from '@playwright/test';

const AUTH_STORAGE_STATE = 'playwright/.clerk/user.json';

export default defineConfig({
  testDir: './tests',
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,

  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ||
      process.env.BASE_URL ||
      'http://127.0.0.1:4100',
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
      name: 'auth-setup',
      testMatch: /tests\/auth\.setup\.ts/,
      use: {
        storageState: undefined,
      },
    },
    {
      name: 'ci-auth',
      testMatch: /tests\/auth\/.*\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        storageState: AUTH_STORAGE_STATE,
      },
    },
    {
      name: 'full-regression',
      testMatch: /tests\/.*\.spec\.ts/,
      testIgnore: [/tests\/auth\/.*\.spec\.ts/, /tests\/auth\.setup\.ts/],
    },
  ],
});
