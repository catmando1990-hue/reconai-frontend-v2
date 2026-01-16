import { test, expect } from '@playwright/test';

// Prod URLs are injected via GitHub Actions env BASE_URL.
// This spec is intentionally auth-agnostic:
// - Protected dashboard routes should redirect to /sign-in (PASS).
// - True 5xx is always a FAIL.

const routes = [
  '/',
  '/dashboard',
  '/dashboard/settings',
  '/customers',
  '/connect-bank',
  '/receipts',
];

const bannedPatterns: Array<{ label: string; re: RegExp }> = [
  { label: 'recharts_invalid_dimensions', re: /width\(-1\)|height\(-1\)/i },
  { label: 'json_truncated', re: /Unexpected end of JSON input/i },
  { label: 'resizeobserver_loop', re: /ResizeObserver loop limit exceeded/i },
];

function formatConsoleLocation(loc?: { url?: string; lineNumber?: number; columnNumber?: number }) {
  if (!loc || (!loc.url && loc.lineNumber == null && loc.columnNumber == null)) return '';
  const url = loc.url ? loc.url : '';
  const line = loc.lineNumber != null ? `:${loc.lineNumber}` : '';
  const col = loc.columnNumber != null ? `:${loc.columnNumber}` : '';
  return url || line || col ? ` (${url}${line}${col})` : '';
}

for (const route of routes) {
  test(`smoke ${route}`, async ({ page }, testInfo) => {
    const consoleFindings: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      const loc = msg.location();
      const locStr = formatConsoleLocation(loc);

      // Always record errors.
      if (msg.type() === 'error') {
        consoleFindings.push(`console.error: ${text}${locStr}`);
        return;
      }

      // Record and fail on banned warning patterns.
      if (msg.type() === 'warning') {
        for (const p of bannedPatterns) {
          if (p.re.test(text)) {
            consoleFindings.push(`console.warn[${p.label}]: ${text}${locStr}`);
            return;
          }
        }
      }
    });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

    const status = response?.status() ?? 0;
    const finalUrl = page.url();

    // Allow protected routes to redirect to sign-in.
    // This is expected when smoke runs without authentication.
    const isSignInRedirect = finalUrl.includes('/sign-in');

    // Fail only on true 5xx.
    // A 3xx redirect is allowed; 4xx can be allowed depending on your rules, but 5xx is always a FAIL.
    if (status >= 500) {
      testInfo.attach('navigation', {
        body: `route=${route}\nstatus=${status}\nfinalUrl=${finalUrl}\n`,
        contentType: 'text/plain',
      });
      expect(status, `5xx on route ${route} (finalUrl=${finalUrl})`).toBeLessThan(500);
    }

    // If we ended up on sign-in, do not enforce app-specific warnings for that route.
    // (Sign-in page can have different console noise; also avoids false positives.)
    if (!isSignInRedirect) {
      if (consoleFindings.length > 0) {
        testInfo.attach('console', {
          body: consoleFindings.join('\n') + '\n',
          contentType: 'text/plain',
        });
      }
      expect(consoleFindings, `Console findings on ${route} (finalUrl=${finalUrl})`).toEqual([]);
    }
  });
}
