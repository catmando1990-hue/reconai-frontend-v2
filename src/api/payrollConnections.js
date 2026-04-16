import api from './client';

/** Allowed values for the `purpose` field on payroll connections. */
export const PAYROLL_PURPOSES = [
  'payroll_funding',
  'tax_payments',
  'benefits',
  'general',
];

/** GET /api/payroll/connections — list Payroll-tier bank connections */
export function list() {
  return api.get('/api/payroll/connections');
}

/** GET /api/payroll/connections/:id */
export function get(connectionId) {
  return api.get(`/api/payroll/connections/${connectionId}`);
}

/** POST /api/payroll/connections/plaid */
export function createPlaid({ publicToken, institutionId, institutionName, purpose = 'general' }) {
  return api.post('/api/payroll/connections/plaid', {
    public_token: publicToken,
    institution_id: institutionId,
    institution_name: institutionName,
    purpose,
  });
}

/** POST /api/payroll/connections/manual */
export function createManual({ institutionName, accountName, accountType, accountMask, purpose }) {
  return api.post('/api/payroll/connections/manual', {
    institution_name: institutionName,
    account_name: accountName,
    account_type: accountType,
    account_mask: accountMask,
    purpose,
  });
}

/** PATCH /api/payroll/connections/:id — update purpose / display name */
export function update(connectionId, { purpose, accountName } = {}) {
  return api.patch(`/api/payroll/connections/${connectionId}`, {
    purpose,
    account_name: accountName,
  });
}

/** DELETE /api/payroll/connections/:id */
export function remove(connectionId) {
  return api.delete(`/api/payroll/connections/${connectionId}`);
}
