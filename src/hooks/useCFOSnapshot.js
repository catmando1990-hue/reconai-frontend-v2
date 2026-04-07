import { useState, useEffect, useCallback } from 'react';
import { cfoApi } from '@/api';

/**
 * CFO Snapshot Hook
 *
 * Main contract-validation and lifecycle-control hook for the CFO module.
 *
 * Core responsibilities:
 * - Fetch CFO snapshot via cfoApi.getDashboard()
 * - Validate response shape
 * - Enforce supported version
 * - Enforce lifecycle validity
 * - Fail closed on unknown contracts
 * - Derive UI-ready state
 */

// Supported CFO versions - add new versions here as they're released
const SUPPORTED_VERSIONS = ['2.0.0', '2.1.0', '2.2.0'];

// Valid lifecycle states per contract
const VALID_LIFECYCLES = ['idle', 'loading', 'pending', 'stale', 'ready', 'refreshing', 'failed'];

// Fail-closed default state
const FAILED_STATE = {
  cfo_version: '1',
  lifecycle: 'failed',
  reason_code: 'unknown',
  reason_message: 'Unable to load CFO data',
  metrics: null,
  snapshot: null,
};

/**
 * Validates the response shape matches expected CFO contract
 */
function validateResponseShape(response) {
  if (!response || typeof response !== 'object') {
    return { valid: false, reason: 'Invalid response type' };
  }

  // Required top-level fields
  const requiredFields = ['cfo_version', 'lifecycle'];
  for (const field of requiredFields) {
    if (!(field in response)) {
      return { valid: false, reason: `Missing required field: ${field}` };
    }
  }

  // Version must be a string
  if (typeof response.cfo_version !== 'string') {
    return { valid: false, reason: 'cfo_version must be a string' };
  }

  // Lifecycle must be a string
  if (typeof response.lifecycle !== 'string') {
    return { valid: false, reason: 'lifecycle must be a string' };
  }

  // If metrics present, must be object or null
  if ('metrics' in response && response.metrics !== null && typeof response.metrics !== 'object') {
    return { valid: false, reason: 'metrics must be an object or null' };
  }

  // If snapshot present, must be object or null
  if ('snapshot' in response && response.snapshot !== null && typeof response.snapshot !== 'object') {
    return { valid: false, reason: 'snapshot must be an object or null' };
  }

  return { valid: true };
}

/**
 * Validates the CFO version is supported
 */
function validateVersion(version) {
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return {
      valid: false,
      reason: `Unsupported CFO version: ${version}. Supported: ${SUPPORTED_VERSIONS.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Validates the lifecycle state is valid
 */
function validateLifecycle(lifecycle) {
  if (!VALID_LIFECYCLES.includes(lifecycle)) {
    return {
      valid: false,
      reason: `Invalid lifecycle state: ${lifecycle}. Valid: ${VALID_LIFECYCLES.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Full contract validation
 */
function validateContract(response) {
  // Shape validation
  const shapeResult = validateResponseShape(response);
  if (!shapeResult.valid) {
    return shapeResult;
  }

  // Version validation
  const versionResult = validateVersion(response.cfo_version);
  if (!versionResult.valid) {
    return versionResult;
  }

  // Lifecycle validation
  const lifecycleResult = validateLifecycle(response.lifecycle);
  if (!lifecycleResult.valid) {
    return lifecycleResult;
  }

  return { valid: true };
}

/**
 * Normalize backend response to the shape expected by the component.
 * Handles snake_case → camelCase and fills defaults for optional fields.
 */
function normalizeSnapshot(raw) {
  // The backend may use snake_case or camelCase — handle both
  const metrics = raw.metrics || {};
  const snapshot = raw.snapshot || {};
  const kpis = raw.kpis || [];
  const risks = raw.risks || [];
  const nextActions = raw.next_actions ?? raw.nextActions ?? [];
  const ds = raw.data_source ?? raw.dataSource ?? {};

  return {
    cfo_version: raw.cfo_version ?? raw.cfoVersion ?? '2.1.0',
    lifecycle: raw.lifecycle ?? 'ready',
    reason_code: raw.reason_code ?? raw.reasonCode ?? null,
    reason_message: raw.reason_message ?? raw.reasonMessage ?? null,
    metrics: {
      totalRevenue: metrics.total_revenue ?? metrics.totalRevenue ?? metrics.totalRevenue ?? null,
      totalExpenses: metrics.total_expenses ?? metrics.totalExpenses ?? null,
      netPosition: metrics.net_position ?? metrics.netPosition ?? null,
      runway: metrics.runway ?? null,
      cashOnHand: metrics.cash_on_hand ?? metrics.cashOnHand ?? null,
      monthlyBurn: metrics.monthly_burn ?? metrics.monthlyBurn ?? null,
      period: metrics.period ?? null,
      transactionCount: metrics.transaction_count ?? metrics.transactionCount ?? null,
    },
    snapshot: {
      status: snapshot.status ?? 'on-track',
      period: snapshot.period ?? null,
      generatedAt: snapshot.generated_at ?? snapshot.generatedAt ?? null,
      boardDate: snapshot.board_date ?? snapshot.boardDate ?? null,
      highlights: snapshot.highlights ?? [],
    },
    kpis,
    risks,
    nextActions,
    dataSource: {
      connectedAccounts: ds.connected_accounts ?? ds.connectedAccounts ?? 0,
      lastSync: ds.last_sync ?? ds.lastSync ?? null,
      institutions: ds.institutions ?? [],
    },
  };
}

/**
 * Fetch CFO snapshot from the backend via cfoApi.getDashboard()
 */
async function fetchCFOSnapshot() {
  const raw = await cfoApi.getDashboard();
  return normalizeSnapshot(raw);
}

/**
 * useCFOSnapshot Hook
 *
 * @returns {Object} Hook state and methods
 * @returns {Object|null} data - The validated CFO snapshot data
 * @returns {boolean} isLoading - Whether the snapshot is currently loading
 * @returns {Error|null} error - Any error that occurred during fetch/validation
 * @returns {boolean} isSuccess - Whether the fetch and validation succeeded
 * @returns {string} lifecycle - Current lifecycle state
 * @returns {string|null} reasonCode - Reason code if lifecycle is not 'ready'
 * @returns {string|null} reasonMessage - Human-readable reason message
 * @returns {Function} refetch - Function to refetch the snapshot
 */
export function useCFOSnapshot() {
  const [state, setState] = useState({
    data: null,
    isLoading: true,
    error: null,
    isSuccess: false,
    lifecycle: 'loading',
    reasonCode: null,
    reasonMessage: null,
  });

  const fetch = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetchCFOSnapshot();

      // Validate contract
      const validation = validateContract(response);

      if (!validation.valid) {
        // Fail closed - return synthetic failure state
        console.warn('[useCFOSnapshot] Contract validation failed:', validation.reason);
        setState({
          data: FAILED_STATE,
          isLoading: false,
          error: new Error(validation.reason),
          isSuccess: false,
          lifecycle: 'failed',
          reasonCode: 'contract_invalid',
          reasonMessage: validation.reason,
        });
        return;
      }

      // Contract valid - derive UI-ready state
      setState({
        data: response,
        isLoading: false,
        error: null,
        isSuccess: response.lifecycle === 'ready',
        lifecycle: response.lifecycle,
        reasonCode: response.reason_code || null,
        reasonMessage: response.reason_message || null,
      });
    } catch (err) {
      // Fetch failed - fail closed
      console.error('[useCFOSnapshot] Fetch failed:', err);
      setState({
        data: FAILED_STATE,
        isLoading: false,
        error: err,
        isSuccess: false,
        lifecycle: 'failed',
        reasonCode: 'fetch_error',
        reasonMessage: err.message || 'Unable to load CFO data',
      });
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    ...state,
    refetch: fetch,
  };
}

// Export validation utilities for testing
export const __testing__ = {
  validateResponseShape,
  validateVersion,
  validateLifecycle,
  validateContract,
  SUPPORTED_VERSIONS,
  VALID_LIFECYCLES,
  FAILED_STATE,
};

export default useCFOSnapshot;
