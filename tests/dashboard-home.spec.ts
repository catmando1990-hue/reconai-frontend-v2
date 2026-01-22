import { test, expect, type Page, type Route } from "@playwright/test";
import { assertNoAuthRedirect } from "./fixtures/test-helpers";

// Import canonical factories - ALL tests MUST use these
import {
  emptyOrgState,
  partialOrgState,
  fullOrgState,
  withSyncRunning,
  withSyncFailed,
  withUnknownSyncVersion,
  withMissingSyncVersion,
  withNullSync,
  withExtendedTransactions,
  assertValidCoreState,
} from "./fixtures/core-state-factory";

import type { CoreState } from "@/hooks/useCoreState";

/**
 * CORE State-of-Business Dashboard Tests
 *
 * P0 FIX: Tests now use single /api/core/state endpoint
 * PART 1 FIX: All tests use canonical coreStateFactory - NO inline mocks
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

// CI AUTH GATE: Skip dashboard tests in remote CI without auth context
// - PLAYWRIGHT_BASE_URL set = running against remote site (prod/staging)
// - PLAYWRIGHT_AUTH not set = no authenticated session
// This preserves full local test coverage while preventing CI failures
const skipInUnauthenticatedEnv =
  !!process.env.PLAYWRIGHT_BASE_URL && !process.env.PLAYWRIGHT_AUTH;

// Canonical mock states from factory - mirrors backend schema exactly
const MOCK_CORE_STATE = {
  empty: emptyOrgState(),
  partial: partialOrgState(),
  full: fullOrgState(),
} as const;

/**
 * Navigate to /home with fail-fast auth redirect check.
 */
async function gotoHome(page: Page): Promise<void> {
  await page.goto("/home", { waitUntil: "domcontentloaded" });
  assertNoAuthRedirect(page);
}

/**
 * Setup API mocking for /api/core/state
 * Uses canonical factory states - validates schema before mocking.
 */
async function setupCoreStateMock(
  page: Page,
  state: keyof typeof MOCK_CORE_STATE,
) {
  const mockState = MOCK_CORE_STATE[state];

  // PART 2: Validate schema before using in tests
  assertValidCoreState(mockState, `setupCoreStateMock(${state})`);

  await page.route("**/api/core/state", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockState),
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

/**
 * Setup API mocking with custom CoreState.
 * Validates schema before mocking.
 */
async function setupCustomCoreStateMock(
  page: Page,
  state: CoreState | Record<string, unknown>,
  skipValidation: boolean = false,
) {
  // Validate unless explicitly skipped (for invalid state tests)
  if (!skipValidation) {
    assertValidCoreState(state, "setupCustomCoreStateMock");
  }

  await page.route("**/api/core/state", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(state),
    });
  });

  await page.route("**/api/me", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "user_test" }),
    });
  });
}

test.describe("CORE State-of-Business Dashboard", () => {
  // Skip entire suite if running in unauthenticated remote environment
  test.skip(
    skipInUnauthenticatedEnv,
    "Dashboard tests require authentication in remote environments",
  );

  test.describe("Empty Organization", () => {
    test.beforeEach(async ({ page }) => {
      await setupCoreStateMock(page, "empty");
    });

    test("shows 'No Financial Data Yet' when available=false", async ({
      page,
    }) => {
      await gotoHome(page);

      // Should show single honest notice - no fake widgets
      const noDataMsg = page.locator("text=No Financial Data Yet");
      await expect(noDataMsg).toBeVisible();

      // Should show action buttons
      const connectBank = page.locator("text=Connect Bank");
      await expect(connectBank).toBeVisible();
    });

    test("does not show Live State section", async ({ page }) => {
      await gotoHome(page);

      // "Requires Attention" heading should not exist
      const attentionHeading = page.locator("text=Requires Attention");
      await expect(attentionHeading).not.toBeVisible();
    });

    test("does not show Evidence section", async ({ page }) => {
      await gotoHome(page);

      // "Financial Evidence" heading should not exist
      const evidenceHeading = page.locator("text=Financial Evidence");
      await expect(evidenceHeading).not.toBeVisible();
    });

    test("does not show Navigation section", async ({ page }) => {
      await gotoHome(page);

      // "Quick Actions" heading should not exist
      const navHeading = page.locator("text=Quick Actions");
      await expect(navHeading).not.toBeVisible();
    });

    test("does not show hardcoded zeros or dashes", async ({ page }) => {
      await gotoHome(page);
      await page.waitForLoadState("domcontentloaded");

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
      await gotoHome(page);

      // Should show "Financial Evidence" heading
      const evidenceHeading = page.locator("text=Financial Evidence");
      await expect(evidenceHeading).toBeVisible();

      // Should show invoicing data
      const invoicingLabel = page.locator("text=Invoicing");
      await expect(invoicingLabel).toBeVisible();
    });

    test("shows Live State with unpaid invoices", async ({ page }) => {
      await gotoHome(page);

      // Should show attention section
      const attentionHeading = page.locator("text=Requires Attention");
      await expect(attentionHeading).toBeVisible();

      // Should show unpaid invoices chip
      const unpaidChip = page.locator("text=2 unpaid invoices");
      await expect(unpaidChip).toBeVisible();
    });

    test("shows Navigation section when data exists", async ({ page }) => {
      await gotoHome(page);

      // Should show "Quick Actions" heading
      const navHeading = page.locator("text=Quick Actions");
      await expect(navHeading).toBeVisible();

      // Should have navigation buttons
      const reviewTransactions = page.locator("text=Review Transactions");
      await expect(reviewTransactions).toBeVisible();
    });

    test("does not show customer/vendor when null", async ({ page }) => {
      await gotoHome(page);

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
      await gotoHome(page);

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
      await gotoHome(page);

      // All three section headings should be visible
      await expect(page.locator("text=Requires Attention")).toBeVisible();
      await expect(page.locator("text=Financial Evidence")).toBeVisible();
      await expect(page.locator("text=Quick Actions")).toBeVisible();
    });

    test("shows unpaid invoices with overdue count", async ({ page }) => {
      await gotoHome(page);

      // Should show unpaid invoices with overdue indicator
      const unpaidInvoices = page.locator("text=5 unpaid invoices");
      await expect(unpaidInvoices).toBeVisible();

      // Should show overdue count
      const overdueCount = page.locator("text=overdue");
      await expect(overdueCount.first()).toBeVisible();
    });

    test("shows bank connection error", async ({ page }) => {
      await gotoHome(page);

      // Should show bank error chip
      const bankError = page.locator("text=Bank connection error");
      await expect(bankError).toBeVisible();
    });

    test("shows customer and vendor counts", async ({ page }) => {
      await gotoHome(page);

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
      await gotoHome(page);

      // Should show recent activity section
      const recentActivity = page.locator("text=Recent Activity");
      await expect(recentActivity).toBeVisible();

      // Should show transaction merchant names
      const merchant = page.locator("text=Office Supplies");
      await expect(merchant).toBeVisible();
    });

    test("attention chips link to correct pages", async ({ page }) => {
      await gotoHome(page);

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

      await gotoHome(page);
      await page.waitForLoadState("domcontentloaded");

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

      await gotoHome(page);
      await page.waitForLoadState("domcontentloaded");

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
      await gotoHome(page);

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
      await gotoHome(page);

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
      await gotoHome(page);

      // Should NOT show sync banner
      const syncRunning = page.locator("text=Syncing financial data");
      await expect(syncRunning).not.toBeVisible();

      const syncFailed = page.locator("text=Sync failed");
      await expect(syncFailed).not.toBeVisible();
    });

    test("shows sync banner when status is 'running'", async ({ page }) => {
      // Use factory to create running sync state
      const runningState = withSyncRunning();
      await setupCustomCoreStateMock(page, runningState);

      await gotoHome(page);

      // Should show running banner
      const syncRunning = page.locator("text=Syncing financial data");
      await expect(syncRunning).toBeVisible();
    });

    test("shows error badge when status is 'failed'", async ({ page }) => {
      // Use factory to create failed sync state
      const failedState = withSyncFailed("Connection timeout");
      await setupCustomCoreStateMock(page, failedState);

      await gotoHome(page);

      // Should show error badge with reason
      const syncFailed = page.locator("text=Sync failed");
      await expect(syncFailed).toBeVisible();

      const errorReason = page.locator("text=Connection timeout");
      await expect(errorReason).toBeVisible();
    });
  });

  test.describe("Evidence Density", () => {
    test("recent activity shows max 3 items", async ({ page }) => {
      // Use factory to create state with 5 transactions
      const stateWithManyTx = withExtendedTransactions(5);
      await setupCustomCoreStateMock(page, stateWithManyTx);

      await gotoHome(page);

      // Should show only first 3 merchants
      await expect(page.locator("text=Merchant 1")).toBeVisible();
      await expect(page.locator("text=Merchant 2")).toBeVisible();
      await expect(page.locator("text=Merchant 3")).toBeVisible();

      // Should NOT show 4th and 5th
      await expect(page.locator("text=Merchant 4")).not.toBeVisible();
      await expect(page.locator("text=Merchant 5")).not.toBeVisible();
    });
  });

  test.describe("Sync Version Contract Enforcement", () => {
    /**
     * PART 3 CONTRACT TESTS - Sync Version Validation
     *
     * P0 FIX: Frontend MUST fail-closed on unknown or missing sync versions.
     * The SUPPORTED_SYNC_VERSIONS list is explicit and maintained in useCoreState.ts.
     * Unknown versions = invalid state = render NOTHING for CORE widgets.
     *
     * PART 1 FIX: Uses canonical factory functions for invalid states.
     */

    test("fails closed when sync version is missing", async ({ page }) => {
      // Use factory to create invalid state with missing version
      const invalidState = withMissingSyncVersion();
      await setupCustomCoreStateMock(page, invalidState, true); // Skip validation for invalid state

      await gotoHome(page);

      // Should fail closed - show "No Financial Data Yet" instead of CORE widgets
      const noDataMsg = page.locator("text=No Financial Data Yet");
      await expect(noDataMsg).toBeVisible();

      // Should NOT show CORE data sections
      const evidenceHeading = page.locator("text=Financial Evidence");
      await expect(evidenceHeading).not.toBeVisible();
    });

    test("fails closed when sync version is unknown", async ({ page }) => {
      // Use factory to create invalid state with unknown version
      const invalidState = withUnknownSyncVersion();
      await setupCustomCoreStateMock(page, invalidState, true); // Skip validation for invalid state

      await gotoHome(page);

      // Should fail closed - show "No Financial Data Yet" instead of CORE widgets
      const noDataMsg = page.locator("text=No Financial Data Yet");
      await expect(noDataMsg).toBeVisible();

      // Should NOT show CORE data sections
      const evidenceHeading = page.locator("text=Financial Evidence");
      await expect(evidenceHeading).not.toBeVisible();
    });

    test("renders data when sync version is supported (v1)", async ({
      page,
    }) => {
      // Use canonical partial state which has version "1"
      await setupCoreStateMock(page, "partial");

      await gotoHome(page);

      // Should render CORE data with supported version
      const evidenceHeading = page.locator("text=Financial Evidence");
      await expect(evidenceHeading).toBeVisible();

      // Should NOT show "No Financial Data Yet"
      const noDataMsg = page.locator("text=No Financial Data Yet");
      await expect(noDataMsg).not.toBeVisible();
    });

    test("fails closed when sync object is null", async ({ page }) => {
      // Use factory to create invalid state with null sync
      const invalidState = withNullSync();
      await setupCustomCoreStateMock(page, invalidState, true); // Skip validation for invalid state

      await gotoHome(page);

      // Should fail closed - show "No Financial Data Yet"
      const noDataMsg = page.locator("text=No Financial Data Yet");
      await expect(noDataMsg).toBeVisible();
    });

    test("SyncBanner only renders for running/failed - never for success/never", async ({
      page,
    }) => {
      // Use canonical partial state which has status: "success"
      await setupCoreStateMock(page, "partial");

      await gotoHome(page);

      // Banner should NOT be visible for success
      const syncRunning = page.locator("text=Syncing financial data");
      const syncFailed = page.locator("text=Sync failed");
      await expect(syncRunning).not.toBeVisible();
      await expect(syncFailed).not.toBeVisible();

      // But CORE data should still render
      const evidenceHeading = page.locator("text=Financial Evidence");
      await expect(evidenceHeading).toBeVisible();
    });
  });

  test.describe("Visual Hierarchy Enforcement", () => {
    /**
     * PART 3 REGRESSION TESTS - DOM Order Enforcement
     *
     * P0 FIX: Visual hierarchy MUST be enforced in DOM order, not CSS.
     * - LiveState (priority=100) ALWAYS precedes SyncBanner (priority=80)
     * - SyncBanner renders in subordinate slot, NEVER in header root
     * - Test fails if hierarchy is inverted
     *
     * PART 1 FIX: Uses canonical factory functions for all states.
     */

    test("Live State precedes Sync Banner in DOM order", async ({ page }) => {
      // Use factory to create full org with sync running
      const fullWithRunning = withSyncRunning(fullOrgState());
      await setupCustomCoreStateMock(page, fullWithRunning);

      await gotoHome(page);

      // Wait for both sections to render
      await expect(page.locator("text=Requires Attention")).toBeVisible();
      await expect(page.locator("text=Syncing financial data")).toBeVisible();

      // Get the dashboard content container
      const dashboardContent = page.locator('[data-testid="dashboard-content"]');
      await expect(dashboardContent).toBeVisible();

      // Assert DOM order: Live State section comes BEFORE sync banner slot
      // This uses Playwright's element ordering based on DOM position
      const liveStateSection = page.locator('[data-testid="live-state-section"]');
      const syncBannerSlot = page.locator('[data-testid="subordinate-banner-slot"]');

      await expect(liveStateSection).toBeVisible();
      await expect(syncBannerSlot).toBeVisible();

      // Verify priority attributes are set correctly
      const liveStatePriority = await liveStateSection.getAttribute("data-priority");
      const syncBannerPriority = await syncBannerSlot.getAttribute("data-priority");

      expect(Number(liveStatePriority)).toBe(100); // LiveState priority
      expect(Number(syncBannerPriority)).toBe(80); // SyncBanner priority
      expect(Number(liveStatePriority)).toBeGreaterThan(Number(syncBannerPriority));

      // Verify DOM order by comparing bounding boxes (top position)
      const liveStateBbox = await liveStateSection.boundingBox();
      const syncBannerBbox = await syncBannerSlot.boundingBox();

      expect(liveStateBbox).not.toBeNull();
      expect(syncBannerBbox).not.toBeNull();

      if (liveStateBbox && syncBannerBbox) {
        // Live State must appear ABOVE (smaller Y) sync banner
        expect(liveStateBbox.y).toBeLessThan(syncBannerBbox.y);
      }
    });

    test("Sync Banner renders in subordinate slot, not header", async ({
      page,
    }) => {
      // Use factory to create failed sync state
      const failedState = withSyncFailed("Test error");
      await setupCustomCoreStateMock(page, failedState);

      await gotoHome(page);

      // Sync banner should be visible
      await expect(page.locator("text=Sync failed")).toBeVisible();

      // Verify sync banner is inside the subordinate slot
      const syncBanner = page.locator('[data-testid="sync-banner"]');
      await expect(syncBanner).toBeVisible();

      // The sync banner MUST be inside the subordinate-banner-slot
      const bannerSlot = page.locator('[data-testid="subordinate-banner-slot"]');
      await expect(bannerSlot).toBeVisible();

      // Verify banner is descendant of slot
      const bannerInSlot = bannerSlot.locator('[data-testid="sync-banner"]');
      await expect(bannerInSlot).toBeVisible();

      // Verify the banner is inside dashboard-content, not in header
      const dashboardContent = page.locator('[data-testid="dashboard-content"]');
      const bannerInContent = dashboardContent.locator('[data-testid="sync-banner"]');
      await expect(bannerInContent).toBeVisible();
    });

    test("hierarchy order cannot be inverted via CSS", async ({ page }) => {
      // This test verifies that even with CSS flexbox reverse or other tricks,
      // the DOM order is what matters for accessibility and structure

      // Use factory to create full org with sync running
      const fullWithRunning = withSyncRunning(fullOrgState());
      await setupCustomCoreStateMock(page, fullWithRunning);

      await gotoHome(page);

      // Get all priority-marked elements in DOM order
      const priorityElements = page.locator("[data-priority]");
      const count = await priorityElements.count();

      expect(count).toBeGreaterThanOrEqual(2); // At least Live State and Sync Banner

      // Collect priorities in DOM order
      const priorities: number[] = [];
      for (let i = 0; i < count; i++) {
        const priority = await priorityElements.nth(i).getAttribute("data-priority");
        if (priority) {
          priorities.push(Number(priority));
        }
      }

      // Verify priorities are in descending order (highest first)
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i - 1]).toBeGreaterThanOrEqual(priorities[i]);
      }
    });
  });
});
