import api from './client';

const BASE = '/api/bookkeeping';

// ── Chart of Accounts ──

export function listAccounts({ accountType, activeOnly = true } = {}) {
  return api.get(`${BASE}/accounts`, {
    params: { account_type: accountType, active_only: activeOnly },
  });
}

export function getAccount(accountId) {
  return api.get(`${BASE}/accounts/${accountId}`);
}

export function createAccount(account) {
  return api.post(`${BASE}/accounts`, account);
}

export function updateAccount(accountId, updates) {
  return api.patch(`${BASE}/accounts/${accountId}`, updates);
}

export function deleteAccount(accountId, { force = false } = {}) {
  return api.delete(`${BASE}/accounts/${accountId}`, { params: { force } });
}

// ── Journal Entries ──

export function listJournalEntries({ startDate, endDate, status } = {}) {
  return api.get(`${BASE}/journal-entries`, {
    params: { start_date: startDate, end_date: endDate, status },
  });
}

export function getJournalEntry(entryId) {
  return api.get(`${BASE}/journal-entries/${entryId}`);
}

export function createJournalEntry(entry) {
  return api.post(`${BASE}/journal-entries`, entry);
}

export function postJournalEntry(entryId) {
  return api.post(`${BASE}/journal-entries/${entryId}/post`);
}

export function voidJournalEntry(entryId) {
  return api.post(`${BASE}/journal-entries/${entryId}/void`);
}

// ── Reports ──

export function getTrialBalance({ asOfDate } = {}) {
  return api.get(`${BASE}/trial-balance`, { params: { as_of_date: asOfDate } });
}

export function getGeneralLedger(accountId, { startDate, endDate } = {}) {
  return api.get(`${BASE}/general-ledger/${accountId}`, {
    params: { start_date: startDate, end_date: endDate },
  });
}

export function getAccountBalance(accountId) {
  return api.get(`${BASE}/account-balance/${accountId}`);
}
