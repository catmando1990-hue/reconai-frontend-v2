import api from './client';

/** GET /api/cfo/connections — list CFO-tier bank connections */
export function list() {
  return api.get('/api/cfo/connections');
}

/** GET /api/cfo/connections/:id — get one CFO connection */
export function get(connectionId) {
  return api.get(`/api/cfo/connections/${connectionId}`);
}

/** POST /api/cfo/connections/plaid — create from Plaid Link callback */
export function createPlaid({ publicToken, institutionId, institutionName }) {
  return api.post('/api/cfo/connections/plaid', {
    public_token: publicToken,
    institution_id: institutionId,
    institution_name: institutionName,
  });
}

/** POST /api/cfo/connections/manual — create manual entry */
export function createManual({ institutionName, accountName, accountType, accountMask }) {
  return api.post('/api/cfo/connections/manual', {
    institution_name: institutionName,
    account_name: accountName,
    account_type: accountType,
    account_mask: accountMask,
  });
}

/** DELETE /api/cfo/connections/:id */
export function remove(connectionId) {
  return api.delete(`/api/cfo/connections/${connectionId}`);
}
