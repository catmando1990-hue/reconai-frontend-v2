import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/dashboard',
  '/dashboard/settings',
  '/customers',
  '/connect-bank',
  '/receipts'
];

for (const route of routes) {
  test(`smoke ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const res = await page.goto(route);
    expect(res?.status()).toBeLessThan(500);
    expect(errors).toEqual([]);
  });
}
