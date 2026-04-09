import api from "./client";

const BASE = "/api/tax-intelligence";

/** GET /api/tax-intelligence/deductions — tax deduction analysis */
export function getDeductions(params) {
  return api.get(`${BASE}/deductions`, { params });
}

/** GET /api/tax-intelligence/schedule-c — Schedule C mappings */
export function getScheduleC(params) {
  return api.get(`${BASE}/schedule-c`, { params });
}

/** GET /api/tax-intelligence/quarterly-estimates — quarterly tax estimates */
export function getQuarterlyEstimates(params) {
  return api.get(`${BASE}/quarterly-estimates`, { params });
}

/** GET /api/tax-intelligence/1099 — 1099 preparation */
export function get1099Prep(params) {
  return api.get(`${BASE}/1099`, { params });
}
