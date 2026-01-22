/**
 * CANONICAL CORE STATE FACTORY
 *
 * Single source of truth for CoreState mock data in tests.
 * EVERY test MUST use this factory - no inline mocks allowed.
 *
 * CONTRACT VERSION: 1
 * Schema mirrors: src/hooks/useCoreState.ts (CoreState)
 *
 * RULES:
 * - Factory produces valid CoreState by default
 * - Use builder methods for test-specific variations
 * - Schema changes MUST update this file FIRST
 */

import type {
  CoreState,
  CoreSyncState,
  CoreLiveState,
  CoreEvidence,
} from "@/hooks/useCoreState";

// =============================================================================
// CONTRACT CONSTANTS - Keep in sync with backend
// =============================================================================

/** Current sync contract version - MUST match backend */
export const SYNC_CONTRACT_VERSION = "1";

/** Valid sync status values - exhaustive, no additions without RFC */
export const VALID_SYNC_STATUSES = [
  "never",
  "running",
  "success",
  "failed",
] as const;
export type SyncStatus = (typeof VALID_SYNC_STATUSES)[number];

// =============================================================================
// SCHEMA ASSERTION HELPER
// =============================================================================

/**
 * Assert a CoreState object matches the canonical schema.
 * FAIL-CLOSED: Throws immediately on any violation.
 *
 * @param state - The state object to validate
 * @param context - Optional context for error messages
 * @throws Error if schema is violated
 */
export function assertValidCoreState(
  state: unknown,
  context?: string
): asserts state is CoreState {
  const prefix = context ? `[${context}] ` : "";

  if (!state || typeof state !== "object") {
    throw new Error(`${prefix}CoreState must be an object, got ${typeof state}`);
  }

  const s = state as Record<string, unknown>;

  // Required top-level fields
  const requiredFields = ["available", "request_id", "fetched_at", "sync", "live_state", "evidence"];
  for (const field of requiredFields) {
    if (!(field in s)) {
      throw new Error(`${prefix}Missing required field: ${field}`);
    }
  }

  // Check for extra fields
  const allowedFields = new Set(requiredFields);
  for (const key of Object.keys(s)) {
    if (!allowedFields.has(key)) {
      throw new Error(`${prefix}Unexpected field: ${key}`);
    }
  }

  // Type validations
  if (typeof s.available !== "boolean") {
    throw new Error(`${prefix}available must be boolean, got ${typeof s.available}`);
  }
  if (typeof s.request_id !== "string") {
    throw new Error(`${prefix}request_id must be string, got ${typeof s.request_id}`);
  }
  if (typeof s.fetched_at !== "string") {
    throw new Error(`${prefix}fetched_at must be string, got ${typeof s.fetched_at}`);
  }

  // Validate sync object
  assertValidSyncState(s.sync, `${prefix}sync`);

  // Validate live_state object
  assertValidLiveState(s.live_state, `${prefix}live_state`);

  // Validate evidence object
  assertValidEvidence(s.evidence, `${prefix}evidence`);
}

/**
 * Assert a sync state object is valid.
 */
function assertValidSyncState(
  sync: unknown,
  context: string
): asserts sync is CoreSyncState {
  if (!sync || typeof sync !== "object") {
    throw new Error(`${context} must be an object, got ${typeof sync}`);
  }

  const s = sync as Record<string, unknown>;

  // Required sync fields
  const requiredFields = ["version", "status", "started_at", "last_successful_at", "error_reason"];
  for (const field of requiredFields) {
    if (!(field in s)) {
      throw new Error(`${context}: Missing required field: ${field}`);
    }
  }

  // Check for extra fields
  const allowedFields = new Set(requiredFields);
  for (const key of Object.keys(s)) {
    if (!allowedFields.has(key)) {
      throw new Error(`${context}: Unexpected field: ${key}`);
    }
  }

  // Validate version
  if (typeof s.version !== "string") {
    throw new Error(`${context}.version must be string, got ${typeof s.version}`);
  }

  // Validate status is in allowed enum
  if (typeof s.status !== "string") {
    throw new Error(`${context}.status must be string, got ${typeof s.status}`);
  }
  if (!VALID_SYNC_STATUSES.includes(s.status as SyncStatus)) {
    throw new Error(
      `${context}.status must be one of [${VALID_SYNC_STATUSES.join(", ")}], got "${s.status}"`
    );
  }

  // Optional fields can be string or null
  if (s.started_at !== null && typeof s.started_at !== "string") {
    throw new Error(`${context}.started_at must be string or null`);
  }
  if (s.last_successful_at !== null && typeof s.last_successful_at !== "string") {
    throw new Error(`${context}.last_successful_at must be string or null`);
  }
  if (s.error_reason !== null && typeof s.error_reason !== "string") {
    throw new Error(`${context}.error_reason must be string or null`);
  }
}

/**
 * Assert a live_state object is valid.
 */
function assertValidLiveState(
  liveState: unknown,
  context: string
): asserts liveState is CoreLiveState {
  if (!liveState || typeof liveState !== "object") {
    throw new Error(`${context} must be an object, got ${typeof liveState}`);
  }

  const s = liveState as Record<string, unknown>;

  // Required live_state fields
  const requiredFields = ["unpaid_invoices", "unpaid_bills", "bank_sync"];
  for (const field of requiredFields) {
    if (!(field in s)) {
      throw new Error(`${context}: Missing required field: ${field}`);
    }
  }

  // Check for extra fields
  const allowedFields = new Set(requiredFields);
  for (const key of Object.keys(s)) {
    if (!allowedFields.has(key)) {
      throw new Error(`${context}: Unexpected field: ${key}`);
    }
  }

  // Each field can be null or an object with specific structure
  if (s.unpaid_invoices !== null) {
    assertValidUnpaidInvoices(s.unpaid_invoices, `${context}.unpaid_invoices`);
  }
  if (s.unpaid_bills !== null) {
    assertValidUnpaidBills(s.unpaid_bills, `${context}.unpaid_bills`);
  }
  if (s.bank_sync !== null) {
    assertValidBankSync(s.bank_sync, `${context}.bank_sync`);
  }
}

function assertValidUnpaidInvoices(data: unknown, context: string): void {
  if (typeof data !== "object" || data === null) {
    throw new Error(`${context} must be an object`);
  }
  const d = data as Record<string, unknown>;
  if (typeof d.count !== "number") {
    throw new Error(`${context}.count must be number`);
  }
  if (typeof d.total_due !== "number") {
    throw new Error(`${context}.total_due must be number`);
  }
  if (!Array.isArray(d.items)) {
    throw new Error(`${context}.items must be array`);
  }
}

function assertValidUnpaidBills(data: unknown, context: string): void {
  if (typeof data !== "object" || data === null) {
    throw new Error(`${context} must be an object`);
  }
  const d = data as Record<string, unknown>;
  if (typeof d.count !== "number") {
    throw new Error(`${context}.count must be number`);
  }
  if (typeof d.total_due !== "number") {
    throw new Error(`${context}.total_due must be number`);
  }
  if (!Array.isArray(d.items)) {
    throw new Error(`${context}.items must be array`);
  }
}

function assertValidBankSync(data: unknown, context: string): void {
  if (typeof data !== "object" || data === null) {
    throw new Error(`${context} must be an object`);
  }
  const d = data as Record<string, unknown>;
  const validStatuses = ["healthy", "stale", "error", "not_connected"];
  if (!validStatuses.includes(d.status as string)) {
    throw new Error(`${context}.status must be one of [${validStatuses.join(", ")}]`);
  }
  if (d.last_synced_at !== null && typeof d.last_synced_at !== "string") {
    throw new Error(`${context}.last_synced_at must be string or null`);
  }
  if (typeof d.items_needing_attention !== "number") {
    throw new Error(`${context}.items_needing_attention must be number`);
  }
}

/**
 * Assert an evidence object is valid.
 */
function assertValidEvidence(
  evidence: unknown,
  context: string
): asserts evidence is CoreEvidence {
  if (!evidence || typeof evidence !== "object") {
    throw new Error(`${context} must be an object, got ${typeof evidence}`);
  }

  const s = evidence as Record<string, unknown>;

  // Required evidence fields
  const requiredFields = ["invoices", "bills", "customers", "vendors", "recent_transactions"];
  for (const field of requiredFields) {
    if (!(field in s)) {
      throw new Error(`${context}: Missing required field: ${field}`);
    }
  }

  // Check for extra fields
  const allowedFields = new Set(requiredFields);
  for (const key of Object.keys(s)) {
    if (!allowedFields.has(key)) {
      throw new Error(`${context}: Unexpected field: ${key}`);
    }
  }
}

// =============================================================================
// CORE STATE FACTORY
// =============================================================================

/**
 * Generate ISO timestamp for test data.
 */
function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Default sync state - version 1, status "never".
 */
function defaultSyncState(): CoreSyncState {
  return {
    version: SYNC_CONTRACT_VERSION,
    status: "never",
    started_at: null,
    last_successful_at: null,
    error_reason: null,
  };
}

/**
 * Default live state - all null (no data).
 */
function defaultLiveState(): CoreLiveState {
  return {
    unpaid_invoices: null,
    unpaid_bills: null,
    bank_sync: null,
  };
}

/**
 * Default evidence - all null (no data).
 */
function defaultEvidence(): CoreEvidence {
  return {
    invoices: null,
    bills: null,
    customers: null,
    vendors: null,
    recent_transactions: null,
  };
}

/**
 * Create a valid CoreState with sensible defaults.
 * Override specific fields as needed for test scenarios.
 */
export function coreStateFactory(
  overrides: Partial<CoreState> = {}
): CoreState {
  const base: CoreState = {
    available: false,
    request_id: `test-${Date.now()}`,
    fetched_at: isoNow(),
    sync: defaultSyncState(),
    live_state: defaultLiveState(),
    evidence: defaultEvidence(),
  };

  // Deep merge overrides
  const result: CoreState = {
    ...base,
    ...overrides,
    sync: {
      ...base.sync,
      ...(overrides.sync || {}),
    },
    live_state: {
      ...base.live_state,
      ...(overrides.live_state || {}),
    },
    evidence: {
      ...base.evidence,
      ...(overrides.evidence || {}),
    },
  };

  // Validate the result
  assertValidCoreState(result, "coreStateFactory");

  return result;
}

// =============================================================================
// PRESET FACTORIES - Common test scenarios
// =============================================================================

/**
 * Empty organization - no data available.
 * Use for testing "No Financial Data Yet" state.
 */
export function emptyOrgState(): CoreState {
  return coreStateFactory({
    available: false,
    request_id: "test-empty",
    sync: {
      version: SYNC_CONTRACT_VERSION,
      status: "never",
      started_at: null,
      last_successful_at: null,
      error_reason: null,
    },
  });
}

/**
 * Partial organization - some data available.
 * Use for testing mixed data display.
 */
export function partialOrgState(): CoreState {
  return coreStateFactory({
    available: true,
    request_id: "test-partial",
    sync: {
      version: SYNC_CONTRACT_VERSION,
      status: "success",
      started_at: null,
      last_successful_at: isoNow(),
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
        last_synced_at: isoNow(),
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
      customers: null,
      vendors: null,
      recent_transactions: null,
    },
  });
}

/**
 * Full organization - all data available with attention items.
 * Use for testing complete data display.
 */
export function fullOrgState(): CoreState {
  return coreStateFactory({
    available: true,
    request_id: "test-full",
    sync: {
      version: SYNC_CONTRACT_VERSION,
      status: "success",
      started_at: null,
      last_successful_at: isoNow(),
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
        last_synced_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
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
  });
}

// =============================================================================
// SYNC STATE BUILDERS - For testing sync lifecycle
// =============================================================================

/**
 * Create state with sync running.
 */
export function withSyncRunning(base?: CoreState): CoreState {
  return coreStateFactory({
    ...(base || partialOrgState()),
    sync: {
      version: SYNC_CONTRACT_VERSION,
      status: "running",
      started_at: isoNow(),
      last_successful_at: null,
      error_reason: null,
    },
  });
}

/**
 * Create state with sync failed.
 */
export function withSyncFailed(errorReason: string, base?: CoreState): CoreState {
  return coreStateFactory({
    ...(base || partialOrgState()),
    sync: {
      version: SYNC_CONTRACT_VERSION,
      status: "failed",
      started_at: new Date(Date.now() - 10000).toISOString(),
      last_successful_at: null,
      error_reason: errorReason,
    },
  });
}

/**
 * Create state with unknown sync version (for fail-closed testing).
 */
export function withUnknownSyncVersion(): Record<string, unknown> {
  // Returns raw object to bypass type checking for invalid state
  const state = partialOrgState();
  return {
    ...state,
    sync: {
      ...state.sync,
      version: "999", // Unknown version
    },
  };
}

/**
 * Create state with missing sync version (for fail-closed testing).
 */
export function withMissingSyncVersion(): Record<string, unknown> {
  // Returns raw object to bypass type checking for invalid state
  const state = partialOrgState();
  const { version, ...syncWithoutVersion } = state.sync;
  return {
    ...state,
    sync: syncWithoutVersion,
  };
}

/**
 * Create state with null sync object (for fail-closed testing).
 */
export function withNullSync(): Record<string, unknown> {
  const state = partialOrgState();
  return {
    ...state,
    sync: null,
  };
}

// =============================================================================
// EVIDENCE BUILDERS - For testing data density
// =============================================================================

/**
 * Create state with extended recent transactions.
 */
export function withExtendedTransactions(count: number, base?: CoreState): CoreState {
  const items = Array.from({ length: count }, (_, i) => ({
    id: `tx${i + 1}`,
    date: `2024-01-${15 - i}`,
    amount: i % 2 === 0 ? -500 - i * 100 : 1200 + i * 100,
    merchant_name: `Merchant ${i + 1}`,
  }));

  return coreStateFactory({
    ...(base || fullOrgState()),
    evidence: {
      ...(base || fullOrgState()).evidence,
      recent_transactions: {
        count: items.length,
        items,
      },
    },
  });
}
