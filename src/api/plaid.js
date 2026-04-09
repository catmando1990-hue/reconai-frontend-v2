import api from "./client";

/** POST /api/plaid/create-link-token */
export function createLinkToken({ redirectUri, entityId } = {}) {
  return api.post("/api/plaid/create-link-token", {
    redirect_uri: redirectUri,
    entity_id: entityId,
  });
}

/** POST /api/plaid/exchange-public-token */
export function exchangePublicToken({
  publicToken,
  institutionId,
  institutionName,
  entityId,
}) {
  return api.post("/api/plaid/exchange-public-token", {
    public_token: publicToken,
    institution_id: institutionId,
    institution_name: institutionName,
    entity_id: entityId,
  });
}

/** POST /api/plaid/transactions/sync */
export function syncTransactions({ itemId, count = 100 }) {
  return api.post("/api/plaid/transactions/sync", {
    item_id: itemId,
    count,
  });
}

/** GET /api/plaid/items — list connected bank items
 *  Returns { items: [{ id, item_id, institution_id, institution_name,
 *           lifecycle, user_message, last_synced_at, created_at }] }
 */
export function listItems({ entityId } = {}) {
  return api.get("/api/plaid/items", { params: { entity_id: entityId } });
}

/** GET /api/plaid/items/:itemId — get bank item details */
export function getItem(itemId) {
  return api.get(`/api/plaid/items/${itemId}`);
}

/** GET /api/plaid/stored-accounts — list stored Plaid accounts
 *  Returns { ok, accounts: [{ id, item_id, account_id, name, official_name,
 *           type, subtype, mask, current_balance, available_balance,
 *           iso_currency_code, created_at, updated_at }], count }
 */
export function getStoredAccounts({ itemId } = {}) {
  return api.get("/api/plaid/stored-accounts", { params: { item_id: itemId } });
}
