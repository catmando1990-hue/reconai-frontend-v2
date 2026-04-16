import api from './client';

/** Allowed cost-pool values per DCAA. */
export const GOVCON_COST_POOLS = [
  'direct',
  'indirect',
  'overhead',
  'g_and_a',
  'fringe',
];

/** Allowed account types for GovCon. */
export const GOVCON_ACCOUNT_TYPES = ['checking', 'savings', 'trust', 'escrow'];

/** GET /api/govcon/connections — list GovCon-tier bank connections.
 *  Optional filters: contractId, costPool.
 */
export function list({ contractId, costPool } = {}) {
  return api.get('/api/govcon/connections', {
    params: { contract_id: contractId, cost_pool: costPool },
  });
}

/** GET /api/govcon/connections/:id */
export function get(connectionId) {
  return api.get(`/api/govcon/connections/${connectionId}`);
}

/** POST /api/govcon/connections — manual-only (DCAA compliance). */
export function createManual({
  institutionName,
  accountName,
  accountType,
  accountNumberMasked,
  routingNumberMasked,
  contractId,
  costPool,
  authorizationDate,
  authorizedBy,
  evidenceDocumentId,
}) {
  return api.post('/api/govcon/connections', {
    institution_name: institutionName,
    account_name: accountName,
    account_type: accountType,
    account_number_masked: accountNumberMasked,
    routing_number_masked: routingNumberMasked,
    contract_id: contractId,
    cost_pool: costPool,
    authorization_date: authorizationDate,
    authorized_by: authorizedBy,
    evidence_document_id: evidenceDocumentId,
  });
}

/** PATCH /api/govcon/connections/:id */
export function update(connectionId, { contractId, costPool, evidenceDocumentId } = {}) {
  return api.patch(`/api/govcon/connections/${connectionId}`, {
    contract_id: contractId,
    cost_pool: costPool,
    evidence_document_id: evidenceDocumentId,
  });
}

/** POST /api/govcon/connections/:id/verify — DCAA verification step */
export function verify(connectionId) {
  return api.post(`/api/govcon/connections/${connectionId}/verify`);
}

/** POST /api/govcon/connections/:id/reject — DCAA rejection */
export function reject(connectionId, { reason } = {}) {
  return api.post(`/api/govcon/connections/${connectionId}/reject`, { reason });
}

/** DELETE /api/govcon/connections/:id */
export function remove(connectionId) {
  return api.delete(`/api/govcon/connections/${connectionId}`);
}
