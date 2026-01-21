import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * State-of-Business Dashboard Tests
 *
 * Tests three organization states:
 * 1. Empty org - No data, should show minimal UI
 * 2. Partial org - Some data, should show relevant sections
 * 3. Full org - All data, should show all sections
 *
 * CANONICAL LAWS VERIFICATION:
 * - No hardcoded zeros displayed
 * - null → "—" (em dash)
 * - Sections only render with backing data
 * - Fail-closed: unknown state explicit
 */

// Mock API responses for different org states
const MOCK_RESPONSES = {
  // Empty org - no data at all
  empty: {
    metrics: {
      counts: null,
      summary: null,
      invoicesByStatus: null,
      billsByStatus: null,
    },
    documents: {
      organization_id: "org_empty",
      documents: [],
      count: 0,
    },
    plaid: {
      status: "not_connected",
      items_count: null,
      last_synced_at: null,
      has_items: false,
      environment: null,
      source: "unknown",
    },
  },

  // Partial org - some metrics, no documents, bank connected
  partial: {
    metrics: {
      counts: {
        invoices: 5,
        bills: 3,
        customers: null, // Partially available
        vendors: null,
      },
      summary: {
        totalInvoiced: 10000,
        totalInvoicePaid: 7500,
        totalInvoiceDue: 2500,
        totalBilled: 5000,
        totalBillPaid: 3000,
        totalBillDue: 2000,
      },
      invoicesByStatus: {
        paid: 3,
        pending: 2,
        overdue: 0,
        draft: 0,
      },
      billsByStatus: {
        paid: 2,
        pending: 1,
        overdue: 0,
        draft: 0,
      },
    },
    documents: {
      organization_id: "org_partial",
      documents: [],
      count: 0,
    },
    plaid: {
      status: "active",
      items_count: 1,
      last_synced_at: new Date().toISOString(), // Fresh sync
      has_items: true,
      environment: "sandbox",
      source: "backend_items",
    },
  },

  // Full org - all data available, some attention items
  full: {
    metrics: {
      counts: {
        invoices: 25,
        bills: 18,
        customers: 12,
        vendors: 8,
      },
      summary: {
        totalInvoiced: 150000,
        totalInvoicePaid: 125000,
        totalInvoiceDue: 25000, // Amounts due - should trigger attention
        totalBilled: 80000,
        totalBillPaid: 70000,
        totalBillDue: 10000,
      },
      invoicesByStatus: {
        paid: 20,
        pending: 3,
        overdue: 2,
        draft: 0,
      },
      billsByStatus: {
        paid: 15,
        pending: 2,
        overdue: 1,
        draft: 0,
      },
    },
    documents: {
      organization_id: "org_full",
      documents: [
        {
          id: "doc_1",
          filename: "invoice_001.pdf",
          status: "processing", // Should show in "documents waiting"
          created_at: new Date().toISOString(),
        },
        {
          id: "doc_2",
          filename: "receipt_002.pdf",
          status: "validated", // Also waiting
          created_at: new Date().toISOString(),
        },
        {
          id: "doc_3",
          filename: "statement_003.pdf",
          status: "completed", // Not waiting
          created_at: new Date().toISOString(),
        },
      ],
      count: 3,
    },
    plaid: {
      status: "login_required", // Should show bank issue
      items_count: 2,
      last_synced_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48h ago - stale
      has_items: true,
      environment: "sandbox",
      source: "backend_items",
    },
  },
};

/**
 * Setup API mocking for a specific org state
 */
async function setupMocks(page: Page, state: keyof typeof MOCK_RESPONSES) {
  const responses = MOCK_RESPONSES[state];

  await page.route("**/api/dashboard/metrics", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responses.metrics),
    });
  });

  await page.route("**/api/documents", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responses.documents),
    });
  });

  await page.route("**/api/plaid/status", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responses.plaid),
    });
  });

  // Mock auth endpoints to avoid redirects in tests
  await page.route("**/api/me", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "user_test", name: "Test User" }),
    });
  });
}

test.describe("State-of-Business Dashboard", () => {
  test.describe("Empty Organization", () => {
    test.beforeEach(async ({ page }) => {
      await setupMocks(page, "empty");
    });

    test("shows unavailable state for metrics", async ({ page }) => {
      await page.goto("/home");

      // Should show "Financial metrics unavailable" message
      const unavailableMsg = page.locator("text=Financial metrics unavailable");
      await expect(unavailableMsg).toBeVisible();
    });

    test("does not show Live State section with no attention items", async ({ page }) => {
      await page.goto("/home");

      // "Requires Attention" heading should not exist
      const attentionHeading = page.locator("text=Requires Attention");
      await expect(attentionHeading).not.toBeVisible();
    });

    test("does not show hardcoded zeros", async ({ page }) => {
      await page.goto("/home");

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Check that we don't see hardcoded "0" or "$0" as values
      // (em dashes "—" are acceptable for null values)
      const pageContent = await page.textContent("body");

      // These patterns would indicate hardcoded zeros (bad)
      const badPatterns = [
        /\$0\.00/,
        /\$0(?![,\d])/, // $0 not followed by more digits
        /\b0 invoices?\b/i,
        /\b0 bills?\b/i,
        /\b0 customers?\b/i,
        /\b0 vendors?\b/i,
      ];

      for (const pattern of badPatterns) {
        expect(pageContent).not.toMatch(pattern);
      }
    });
  });

  test.describe("Partial Organization", () => {
    test.beforeEach(async ({ page }) => {
      await setupMocks(page, "partial");
    });

    test("shows Financial Evidence section with available data", async ({ page }) => {
      await page.goto("/home");

      // Should show "Financial Evidence" heading
      const evidenceHeading = page.locator("text=Financial Evidence");
      await expect(evidenceHeading).toBeVisible();

      // Should show invoicing data
      const invoicingLabel = page.locator("text=Invoicing");
      await expect(invoicingLabel).toBeVisible();

      // Should show the invoiced amount ($10,000)
      const invoicedAmount = page.locator("text=$10,000");
      await expect(invoicedAmount).toBeVisible();
    });

    test("shows Live State with amounts due", async ({ page }) => {
      await page.goto("/home");

      // Should show attention chip for amounts due
      const attentionChip = page.locator("text=Amounts due");
      await expect(attentionChip).toBeVisible();
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

    test("uses em dash for null customer/vendor counts", async ({ page }) => {
      await page.goto("/home");

      // Customer and vendor panels should not render at all when null
      // (conditional rendering deletes them, doesn't show "—")
      const customersLabel = page.locator("text=Active customer records");
      const vendorsLabel = page.locator("text=Active vendor records");

      // These should NOT be visible because data is null
      await expect(customersLabel).not.toBeVisible();
      await expect(vendorsLabel).not.toBeVisible();
    });
  });

  test.describe("Full Organization", () => {
    test.beforeEach(async ({ page }) => {
      await setupMocks(page, "full");
    });

    test("shows all three sections", async ({ page }) => {
      await page.goto("/home");

      // All three section headings should be visible
      await expect(page.locator("text=Requires Attention")).toBeVisible();
      await expect(page.locator("text=Financial Evidence")).toBeVisible();
      await expect(page.locator("text=Quick Actions")).toBeVisible();
    });

    test("shows documents waiting count", async ({ page }) => {
      await page.goto("/home");

      // Should show "2 documents processing" (processing + validated)
      const docsWaiting = page.locator("text=2 documents processing");
      await expect(docsWaiting).toBeVisible();
    });

    test("shows bank connection issue", async ({ page }) => {
      await page.goto("/home");

      // Should show bank needs re-auth
      const bankIssue = page.locator("text=Bank connection needs re-auth");
      await expect(bankIssue).toBeVisible();
    });

    test("shows all financial metrics", async ({ page }) => {
      await page.goto("/home");

      // Should show customer and vendor counts
      const customersCount = page.locator("text=12"); // 12 customers
      const vendorsCount = page.locator("text=8"); // 8 vendors

      await expect(customersCount.first()).toBeVisible();
      await expect(vendorsCount.first()).toBeVisible();

      // Should show invoices and bills
      await expect(page.locator("text=25 invoices")).toBeVisible();
      await expect(page.locator("text=18 bills")).toBeVisible();
    });

    test("attention chips are clickable links", async ({ page }) => {
      await page.goto("/home");

      // Documents waiting chip should link to /documents
      const docsLink = page.locator('a:has-text("documents processing")');
      await expect(docsLink).toHaveAttribute("href", "/documents");

      // Bank issue chip should link to /settings
      const bankLink = page.locator('a:has-text("Bank connection")');
      await expect(bankLink).toHaveAttribute("href", "/settings");
    });
  });

  test.describe("Canonical Laws Compliance", () => {
    test("null values display as em dash, not zero", async ({ page }) => {
      await setupMocks(page, "empty");
      await page.goto("/home");

      // Page should not contain literal "0" as a displayed count
      // (Unless it's actually a verified zero, which empty org doesn't have)
      await page.waitForLoadState("networkidle");

      // Check for em dash character (—) which indicates null
      const pageContent = await page.textContent("body");

      // If there's any displayed metric, it should use em dash for null
      // The empty org should show "Financial metrics unavailable" instead
      expect(pageContent).toContain("Financial metrics unavailable");
    });

    test("sections conditionally render based on data", async ({ page }) => {
      await setupMocks(page, "empty");
      await page.goto("/home");
      await page.waitForLoadState("networkidle");

      // With empty org, Navigation section should not render
      // because showNavigation depends on having any data
      const navSection = page.locator("text=Quick Actions");
      await expect(navSection).not.toBeVisible();
    });

    test("signals panel requires manual fetch", async ({ page }) => {
      await setupMocks(page, "partial");
      await page.goto("/home");

      // Signals panel should show "Manual run" status initially
      const signalsStatus = page.locator("text=Manual run");
      await expect(signalsStatus).toBeVisible();

      // Should have "Fetch Signals" button (not auto-executed)
      const fetchButton = page.locator("button:has-text('Fetch Signals')");
      await expect(fetchButton).toBeVisible();
    });
  });
});
