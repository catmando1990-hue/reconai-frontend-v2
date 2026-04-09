import api from "./client";

/**
 * GovCon endpoints — verified against backend route map.
 *
 * Backend mounts:
 *   - govcon_contracts       → /govcon/contracts
 *   - govcon_timekeeping     → /govcon/timekeeping
 *   - govcon_indirects       → /govcon/indirects
 *   - govcon_reconciliation  → /govcon/reconciliation
 *   - govcon_audit           → /govcon/audit
 *   - govcon_compliance_api  → /api/govcon (classify, transactions, export, stats)
 *   - compliance_automation  → /api/compliance (frameworks, dcaa/status, sf1408/mappings, gaps)
 */

// ── Contracts ──

export function listContracts() {
  return api.get("/govcon/contracts/");
}

export function getContract(contractId) {
  return api.get(`/govcon/contracts/${contractId}`);
}

export function createContract(contract) {
  return api.post("/govcon/contracts/", contract);
}

export function getContractAuditTrail(contractId) {
  return api.get(`/govcon/contracts/${contractId}/audit-trail`);
}

export function getContractFundingStatus(contractId) {
  return api.get(`/govcon/contracts/${contractId}/funding-status`);
}

export function createModification(contractId, modification) {
  return api.post(
    `/govcon/contracts/${contractId}/modifications`,
    modification,
  );
}

export function approveModification(contractId, modificationId) {
  return api.post(
    `/govcon/contracts/${contractId}/modifications/${modificationId}/approve`,
  );
}

// ── Timekeeping ──

export function listTimesheets(params) {
  return api.get("/govcon/timekeeping/timesheets", { params });
}

export function getTimesheet(timesheetId) {
  return api.get(`/govcon/timekeeping/timesheets/${timesheetId}`);
}

export function submitTimesheet(timesheet) {
  return api.post("/govcon/timekeeping/timesheets", timesheet);
}

export function addTimesheetEntries(timesheetId, entries) {
  return api.post(
    `/govcon/timekeeping/timesheets/${timesheetId}/entries`,
    entries,
  );
}

export function submitTimesheetForApproval(timesheetId) {
  return api.post(`/govcon/timekeeping/timesheets/${timesheetId}/submit`);
}

export function approveTimesheet(timesheetId) {
  return api.post(`/govcon/timekeeping/timesheets/${timesheetId}/approve`);
}

export function correctTimesheet(timesheetId, correction) {
  return api.post(
    `/govcon/timekeeping/timesheets/${timesheetId}/correct`,
    correction,
  );
}

export function getLaborDistribution(params) {
  return api.get("/govcon/timekeeping/labor-distribution", { params });
}

// ── Indirect Costs ──

export function listIndirectPools() {
  return api.get("/govcon/indirects/pools");
}

export function getIndirectPool(poolId) {
  return api.get(`/govcon/indirects/pools/${poolId}`);
}

export function createIndirectPool(pool) {
  return api.post("/govcon/indirects/pools", pool);
}

export function addPoolCosts(poolId, costs) {
  return api.post(`/govcon/indirects/pools/${poolId}/costs`, costs);
}

export function calculatePoolRate(poolId) {
  return api.post(`/govcon/indirects/pools/${poolId}/calculate-rate`);
}

export function listAllocationRates() {
  return api.get("/govcon/indirects/rates");
}

export function createAllocationRate(rate) {
  return api.post("/govcon/indirects/rates", rate);
}

// Backwards compat alias
export const getAllocationRates = listAllocationRates;

// ── Reconciliation ──

export function listReconciliationReports() {
  return api.get("/govcon/reconciliation/reports");
}

export function getReconciliationReport(reportId) {
  return api.get(`/govcon/reconciliation/reports/${reportId}`);
}

export function createReconciliationReport(report) {
  return api.post("/govcon/reconciliation/reports", report);
}

export function runLaborReconciliation(reportId) {
  return api.post(`/govcon/reconciliation/reports/${reportId}/run-labor`);
}

export function runIndirectReconciliation(reportId) {
  return api.post(`/govcon/reconciliation/reports/${reportId}/run-indirect`);
}

export function approveReconciliation(reportId) {
  return api.post(`/govcon/reconciliation/reports/${reportId}/approve`);
}

export function submitIncurredCost(submission) {
  return api.post("/govcon/reconciliation/incurred-cost", submission);
}

export function getIncurredCost(submissionId) {
  return api.get(`/govcon/reconciliation/incurred-cost/${submissionId}`);
}

export function createSF1408Checklist(checklist) {
  return api.post("/govcon/reconciliation/sf1408", checklist);
}

export function getSF1408Checklist(checklistId) {
  return api.get(`/govcon/reconciliation/sf1408/${checklistId}`);
}

// Backwards compat aliases
export const getReconciliation = listReconciliationReports;
export const getICSPrep = (id) => getIncurredCost(id);
export const getSF1408Compliance = getSF1408Checklist;

// ── Audit ──

export function getAuditEntries(params) {
  return api.get("/govcon/audit/entries", { params });
}

export function getAuditEntry(entryId) {
  return api.get(`/govcon/audit/entries/${entryId}`);
}

export function getEntityAuditTrail(entityType, entityId) {
  return api.get(`/govcon/audit/entity/${entityType}/${entityId}`);
}

export function exportAudit(payload) {
  return api.post("/govcon/audit/export", payload);
}

export function listAuditExports() {
  return api.get("/govcon/audit/exports");
}

export function verifyAuditIntegrity() {
  return api.get("/govcon/audit/verify-integrity");
}

export function getAuditSummary() {
  return api.get("/govcon/audit/summary");
}

// Backwards compat aliases
export const getAuditTrail = getAuditEntries;
export const verifyAuditChain = verifyAuditIntegrity;

// ── Compliance (compliance_automation_api at /api/compliance) ──

export function getComplianceFrameworks() {
  return api.get("/api/compliance/frameworks");
}

export function getComplianceStatus() {
  return api.get("/api/compliance/dcaa/status");
}

export function getSF1408Mappings() {
  return api.get("/api/compliance/sf1408/mappings");
}

export function getComplianceGaps() {
  return api.get("/api/compliance/gaps");
}

export function collectEvidence(payload) {
  return api.post("/api/compliance/evidence/collect", payload);
}

// ── GovCon Compliance Overlay (govcon_compliance_api at /api/govcon) ──

export function classifyTransactions(payload) {
  return api.post("/api/govcon/classify", payload);
}

export function getClassifiedTransactions(params) {
  return api.get("/api/govcon/transactions", { params });
}

export function exportSF1408(payload) {
  return api.post("/api/govcon/export", payload);
}

export function getGovConStats() {
  return api.get("/api/govcon/stats");
}
