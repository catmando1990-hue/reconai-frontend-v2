import api from "./client";

/**
 * Plaid Transactions endpoints — verified against
 * app/routers/plaid_transactions_api.py (mounted at /api/plaid).
 *
 * Response shape for getTransactions:
 *   { ok: bool, transactions: [...], total: int, limit: int, offset: int }
 */

/** GET /api/plaid/transactions — list stored Plaid transactions */
export function getTransactions({
  startDate,
  endDate,
  itemId,
  accountId,
  limit = 100,
  offset = 0,
} = {}) {
  return api.get("/api/plaid/transactions", {
    params: {
      start_date: startDate,
      end_date: endDate,
      item_id: itemId,
      account_id: accountId,
      limit,
      offset,
    },
  });
}

/** GET /api/plaid/stored-accounts — list stored Plaid accounts */
export function getStoredAccounts({ itemId } = {}) {
  return api.get("/api/plaid/stored-accounts", {
    params: { item_id: itemId },
  });
}

/** POST /api/plaid/sync-and-store — sync and persist transactions for an item */
export function syncAndStore({ itemId, count = 500 }) {
  return api.post("/api/plaid/sync-and-store", null, {
    params: { item_id: itemId, count },
  });
}

/** POST /api/plaid/backfill — fetch and persist N months of historical transactions */
export function backfill({ itemId, months = 24 }) {
  return api.post("/api/plaid/backfill", null, {
    params: { item_id: itemId, months },
  });
}

/** POST /api/transactions/{id}/override — override transaction classification */
export function overrideTransaction(id, override) {
  return api.post(`/api/transactions/${id}/override`, override);
}
