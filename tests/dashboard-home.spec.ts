import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * CORE State-of-Business Dashboard Tests
 *
 * P0 FIX: Tests now use single /api/core/state endpoint
 *
 * Tests three organization states:
 * 1. Empty org - No data, should show "No Financial Data Yet"
 * 2. Partial org - Some data, should show relevant sections
 * 3. Full org - All data, should show all sections
 *
 * VERIFICATION:
 * - No hardcoded zeros displayed
 * - No dashes ("--") anywhere
 * - Sections only render with backing data
 * - Data appears on load (no manual fetch buttons for CORE)
 *
 * NOTE: These tests require Clerk authentication mocking.
 * In local dev without auth bypass, tests will fail due to redirect to /sign-in.
 * For CI, use Clerk test mode or authenticated browser context.
 */

// Skip tests in environments where Clerk auth redirects to sign-in
// This is detected by checking if PLAYWRIGHT_AUTH_BYPASS or similar env is set
const skipInUnauthenticatedEnv =
  !process.env.PLAYWRIGHT_AUTH_BYPASS && !process.env.CI;

// Mock CORE state responses
const MOCK_CORE_STATE = {
  // Empty org - no data at all
  empty: {
    available: false,
    request_id: "test-empty",
    fetched_at: new Date().toISOString(),
    sync: {
      status: "never",
      started_at: null,
      last_successful_at: null,
      error_reason: null,
    },
    live_state: {
      unpaid_invoices: null,
      unpaid_bills: null,
      bank_sync: null,
    },
    evidence: {
      invoices: null,
      bills: null,
      customers: null,
      vendors: null,
      recent_transactions: null,
    },
  },

  // Partial org - some data, bank connected
  partial: {
    available: true,
    request_id: "test-partial",
    fetched_at: new Date().toISOString(),
    sync: {
      status: "success",
      started_at: null,
      last_successful_at: new Date().toISOString(),
      error_reason: null,
    },
    live_state: {
      unpaid_invoices: {
        count: 2,
        total_due: 2500,
        items: [
          {
            id: "inv1",
            customer_name: "Acme Corp",
            amount_due: 1500,
            due_date: null,
            is_overdue: false,
          },
          {
            id: "inv2",
            customer_name: "Beta Inc",
            amount_due: 1000,
            due_date: null,
            is_overdue: false,
          },
        ],
      },
      unpaid_bills: null,
      bank_sync: {
        status: "healthy",
        last_synced_at: new Date().toISOString(),
        items_needing_attention: 0,
      },
    },
    evidence: {
      invoices: {
        total_count: 5,
        total_amount: 10000,
        paid_amount: 7500,
        due_amount: 2500,
        by_status: { paid: 3, pending: 2, overdue: 0, draft: 0 },
      },
      bills: {
        total_count: 3,
        total_amount: 5000,
        paid_amount: 5000,
        due_amount: 0,
        by_status: { paid: 3, pending: 0, overdue: 0 },
      },
      customers: null, // Partially available
      vendors: null,
      recent_transactions: null,
    },
  },

  // Full org - all data, attention items
  full: {
    available: true,
    request_id: "test-full",
    fetched_at: new Date().toISOString(),
    sync: {
      status: "success",
      started_at: null,
      last_successful_at: new Date().toISOString(),
      error_reason: null,
    },
    live_state: {
      unpaid_invoices: {
        count: 5,
        total_due: 25000,
        items: [
          {
            id: "inv1",
            customer_name: "Acme Corp",
            amount_due: 10000,
            due_date: "2024-01-01",
            is_overdue: true,
          },
          {
            id: "inv2",
            customer_name: "Beta Inc",
            amount_due: 8000,
            due_date: null,
            is_overdue: false,
          },
        ],
      },
      unpaid_bills: {
        count: 3,
        total_due: 10000,
        items: [
          {
            id: "bill1",
            vendor_name: "Vendor A",
            amount_due: 5000,
            due_date: "2024-01-01",
            is_overdue: true,
          },
        ],
      },
      bank_sync: {
        status: "error",
        last_synced_at: new Date(
          Date.now() - 48 * 60 * 60 * 1000,
        ).toISOString(),
        items_needing_attention: 2,
      },
    },
    evidence: {
      invoices: {
        total_count: 25,
        total_amount: 150000,
        paid_amount: 125000,
        due_amount: 25000,
        by_status: { paid: 20, pending: 3, overdue: 2, draft: 0 },
      },
      bills: {
        total_count: 18,
        total_amount: 80000,
        paid_amount: 70000,
        due_amount: 10000,
        by_status: { paid: 15, pending: 2, overdue: 1 },
      },
      customers: { total_count: 12 },
      vendors: { total_count: 8 },
      recent_transactions: {
        count: 5,
        items: [
          {
            id: "tx1",
            date: "2024-01-15",
            amount: -500,
            merchant_name: "Office Supplies",
          },
          {
            id: "tx2",
            date: "2024-01-14",
            amount: 1200,
            merchant_name: "Client Payment",
          },
        ],
      },
    },
  },
};

/**
 * Setup API mocking for /api/core/state
 */
async function setupCoreStateMock(
  page: Page,
  state: keyof typeof MOCK_CORE_STATE,
) {
  await page.route("**/api/core/state", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CORE_STATE[state]),
    });
  });

  // Mock auth endpoints to avoid redirects
  await page.route("**/api/me", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "user_test", name: "Test User" }),
    });
  });
}

test.describe("CORE State-of-Business Dashboard", () => {
  // Skip entire suite if running in unauthenticated environment
  test.skip(
    skipInUnauthenticatedEnv,
    "Requires authenticated Clerk session - set PLAYWRIGHT_AUTH_BYPASS=1 or run in CI",
  );

  test.describe("Empty Organization", () => {
    test.beforeEach(async ({ page }) => {
      await setupCoreStateMock(page, "empty");
    });

    test("shows 'No Financial Data Yet' when available=false", async ({
      page,
    }) => {
      await page.goto("/home");

      // Should show single honest notice - no fake widgets
      const noDataMsg = page.locator("text=No Financial Data Yet");
      await expect(noDataMsg).toBeVisible();

      // Should show action buttons
      const connectBank = page.locator("text=Connect Bank");
      await expect(connectBank).toBeVisible();
    });

    test("does not show Live State section", async ({ page }) => {
      await page.goto("/home");

      // "Requires Attention" heading should not exist
      const attentionHeading = page.locator("text=Requires Attention");
      await expect(attentionHeading).not.toBeVisible();
    });

    test("does not show Evidence section", async ({ page }) => {
      await page.goto("/home");

      // "Financial Evidence" heading should not exist
      const evidenceHeading = page.locator("text=Financial Evidence");
      await expect(evidenceHeading).not.toBeVisible();
    });

    test("does not show Navigation section", async ({ page }) => {
      await page.goto("/home");

      // "Quick Actions" heading should not exist
      const navHeading = page.locator("text=Quick Actions");
      await expect(navHeading).not.toBeVisible();
    });

    test("does not show hardcoded zeros or dashes", async ({ page }) => {
      await page.goto("/home");
      await page.waitForLoadState("networkidle");

      const pageContent = await page.textContent("body");

      // P0 RULE: No dashes anywhere
      expect(pageContent).not.toContain("--");

      // No hardcoded zeros in data display
      const badPatterns = [
        /\$0\.00/,
        /\$0(?![,\d])/,
        /\b0 invoices?\b/i,
        /\b0 bills?\b/i,
      ];

      for (const pattern of badPatterns) {
        expect(pageContent).not.toMatch(pattern);
      }
    });
  });

  test.describe("Partial Organization", () => {
    test.beforeEach(async ({ page }) => {
      await setupCoreStateMock(page, "partial");
    });

    test("shows Financial Evidence section with available data", async ({
      page,
    }) => {
      await page.goto("/home");

      // Should show "Financial Evidence" heading
      const evidenceHeading = page.locator("text=Financial Evidence");
      await expect(evidenceHeading).toBeVisible();

      // Should show invoicing data
      const invoicingLabel = page.locator("text=Invoicing");
      await expect(invoicingLabel).toBeVisible();
    });

    test("shows Live State with unpaid invoices", async ({ page }) => {
      await page.goto("/home");

      // Should show attention section
      const attentionHeading = page.locator("text=Requires Attention");
      await expect(attentionHeading).toBeVisible();

      // Should show unpaid invoices chip
      const unpaidChip = page.locator("text=2 unpaid invoices");
      await expect(unpaidChip).toBeVisible();
    });

    test("shows Navigation section when data exists", async ({ page }) => {
      await page.goto("/home");

      // Should show "Quick Actions" heading
      const navHeading = page.locator("text=Quick Actions");
      await expect(navHeading).toBeVisible();

      // Should have navigation buttons
      const reviewTransactions = page.locator("text=Review Transactions");
      await expect(reviewTransactions).toBeVisible();
    });

    test("does not show customer/vendor when null", async ({ page }) => {
      await page.goto("/home");

      // Customer and vendor cards should not render when null
      const customersCard = page.locator("text=Customers").first();
      const vendorsCard = page.locator("text=Vendors").first();

      // These should NOT be visible because data is null
      await expect(customersCard).not.toBeVisible();
      await expect(vendorsCard).not.toBeVisible();
    });

    test("data appears on load - no manual fetch required", async ({
      page,
    }) => {
      await page.goto("/home");

      // Data should appear automatically - no "Fetch" button for CORE
      await expect(page.locator("text=Invoicing")).toBeVisible();

      // Should NOT have a "Fetch" button for core data
      const fetchButton = page.locator("button:has-text('Fetch')").first();
      // Count should be 0 or the button shouldn't be for core state
      const fetchCount = await fetchButton.count();
      expect(fetchCount).toBe(0);
    });
  });

  test.describe("Full Organization", () => {
    test.beforeEach(async ({ page }) => {
      await setupCoreStateMock(page, "full");
    });

    test("shows all three sections", async ({ page }) => {
      await page.goto("/home");

      // All three section headings should be visible
      await expect(page.locator("text=Requires Attention")).toBeVisible();
      await expect(page.locator("text=Financial Evidence")).toBeVisible();
      await expect(page.locator("text=Quick Actions")).toBeVisible();
    });

    test("shows unpaid invoices with overdue count", async ({ page }) => {
      await page.goto("/home");

      // Should show unpaid invoices with overdue indicator
      const unpaidInvoices = page.locator("text=5 unpaid invoices");
      await expect(unpaidInvoices).toBeVisible();

      // Should show overdue count
      const overdueCount = page.locator("text=overdue");
      await expect(overdueCount.first()).toBeVisible();
    });

    test("shows bank connection error", async ({ page }) => {
      await page.goto("/home");

      // Should show bank error chip
      const bankError = page.locator("text=Bank connection error");
      await expect(bankError).toBeVisible();
    });

    test("shows customer and vendor counts", async ({ page }) => {
      await page.goto("/home");

      // Should show customer count
      const customersCard = page.locator("text=Customers");
      await expect(customersCard).toBeVisible();

      // Should show vendor count
      const vendorsCard = page.locator("text=Vendors");
      await expect(vendorsCard).toBeVisible();

      // Should show the actual counts (12 customers, 8 vendors)
      await expect(page.locator("text=12").first()).toBeVisible();
      await expect(page.locator("text=8").first()).toBeVisible();
    });

    test("shows recent activity", async ({ page }) => {
      await page.goto("/home");

      // Should show recent activity section
      const recentActivity = page.locator("text=Recent Activity");
      await expect(recentActivity).toBeVisible();

      // Should show transaction merchant names
      const merchant = page.locator("text=Office Supplies");
      await expect(merchant).toBeVisible();
    });

    test("attention chips link to correct pages", async ({ page }) => {
      await page.goto("/home");

      // Unpaid invoices chip should link to /invoicing
      const invoicesLink = page.locator('a:has-text("unpaid invoices")');
      await expect(invoicesLink).toHaveAttribute("href", "/invoicing");

      // Bank error chip should link to /settings
      const bankLink = page.locator('a:has-text("Bank connection error")');
      await expect(bankLink).toHaveAttribute("href", "/settings");
    });
  });

  test.describe("P0 Compliance Verification", () => {
    test("core_state fetched once per page", async ({ page }) => {
      let fetchCount = 0;

      await page.route("**/api/core/state", async (route: Route) => {
        fetchCount++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_CORE_STATE.partial),
        });
      });

      await page.route("**/api/me", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "user_test" }),
        });
      });

      await page.goto("/home");
      await page.waitForLoadState("networkidle");

      // Should only fetch once
      expect(fetchCount).toBe(1);
    });

    test("no separate card fetches - all from core_state", async ({ page }) => {
      const fetchedEndpoints: string[] = [];

      await page.route("**/*", async (route: Route) => {
        const url = route.request().url();
        if (url.includes("/api/")) {
          fetchedEndpoints.push(url);
        }

        if (url.includes("/api/core/state")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(MOCK_CORE_STATE.full),
          });
        } else if (url.includes("/api/me")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ id: "user_test" }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/home");
      await page.waitForLoadState("networkidle");

      // Should NOT have separate fetches for invoices, bills, etc.
      const coreFetches = fetchedEndpoints.filter(
        (url) =>
          url.includes("/api/invoices") ||
          url.includes("/api/bills") ||
          url.includes("/api/customers") ||
          url.includes("/api/vendors"),
      );

      expect(coreFetches.length).toBe(0);
    });

    test("cards readable at a glance - proper contrast", async ({ page }) => {
      await setupCoreStateMock(page, "full");
      await page.goto("/home");

      // Check that key elements are visible (implies readable)
      const invoiceAmount = page.locator("text=$150,000");
      await expect(invoiceAmount).toBeVisible();

      // Check attention items have visible styling
      const attentionChip = page.locator('a:has-text("unpaid invoices")');
      await expect(attentionChip).toBeVisible();
    });
  });

  test.describe("Sync Lifecycle Visibility", () => {
    test("does not show sync banner when status is 'success'", async ({
      page,
    }) => {
      // Default mocks use status: "success"
      await setupCoreStateMock(page, "full");
      await page.goto("/home");

      // Should NOT show sync banner
      const syncRunning = page.locator("text=Syncing financial data");
      await expect(syncRunning).not.toBeVisible();

      const syncFailed = page.locator("text=Sync failed");
      await expect(syncFailed).not.toBeVisible();
    });

    test("does not show sync banner when status is 'never'", async ({
      page,
    }) => {
      // Empty org has sync.status: "never"
      await setupCoreStateMock(page, "empty");
      await page.goto("/home");

      // Should NOT show sync banner
      const syncRunning = page.locator("text=Syncing financial data");
      await expect(syncRunning).not.toBeVisible();

      const syncFailed = page.locator("text=Sync failed");
      await expect(syncFailed).not.toBeVisible();
    });

    test("shows sync banner when status is 'running'", async ({ page }) => {
      await page.route("**/api/core/state", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...MOCK_CORE_STATE.partial,
            sync: {
              status: "running",
              started_at: new Date().toISOString(),
              last_successful_at: null,
              error_reason: null,
            },
          }),
        });
      });

      await page.route("**/api/me", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "user_test" }),
        });
      });

      await page.goto("/home");

      // Should show running banner
      const syncRunning = page.locator("text=Syncing financial data");
      await expect(syncRunning).toBeVisible();
    });

    test("shows error badge when status is 'failed'", async ({ page }) => {
      await page.route("**/api/core/state", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...MOCK_CORE_STATE.partial,
            sync: {
              status: "failed",
              started_at: new Date(Date.now() - 10000).toISOString(),
              last_successful_at: null,
              error_reason: "Connection timeout",
            },
          }),
        });
      });

      await page.route("**/api/me", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "user_test" }),
        });
      });

      await page.goto("/home");

      // Should show error badge with reason
      const syncFailed = page.locator("text=Sync failed");
      await expect(syncFailed).toBeVisible();

      const errorReason = page.locator("text=Connection timeout");
      await expect(errorReason).toBeVisible();
    });
  });

  test.describe("Evidence Density", () => {
    test("recent activity shows max 3 items", async ({ page }) => {
      await page.route("**/api/core/state", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...MOCK_CORE_STATE.full,
            evidence: {
              ...MOCK_CORE_STATE.full.evidence,
              recent_transactions: {
                count: 10,
                items: [
                  {
                    id: "tx1",
                    date: "2024-01-15",
                    amount: -500,
                    merchant_name: "Merchant 1",
                  },
                  {
                    id: "tx2",
                    date: "2024-01-14",
                    amount: 1200,
                    merchant_name: "Merchant 2",
                  },
                  {
                    id: "tx3",
                    date: "2024-01-13",
                    amount: -300,
                    merchant_name: "Merchant 3",
                  },
                  {
                    id: "tx4",
                    date: "2024-01-12",
                    amount: 800,
                    merchant_name: "Merchant 4",
                  },
                  {
                    id: "tx5",
                    date: "2024-01-11",
                    amount: -150,
                    merchant_name: "Merchant 5",
                  },
                ],
              },
            },
          }),
        });
      });

      await page.route("**/api/me", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "user_test" }),
        });
      });

      await page.goto("/home");

      // Should show only first 3 merchants
      await expect(page.locator("text=Merchant 1")).toBeVisible();
      await expect(page.locator("text=Merchant 2")).toBeVisible();
      await expect(page.locator("text=Merchant 3")).toBeVisible();

      // Should NOT show 4th and 5th
      await expect(page.locator("text=Merchant 4")).not.toBeVisible();
      await expect(page.locator("text=Merchant 5")).not.toBeVisible();
    });
  });
});
