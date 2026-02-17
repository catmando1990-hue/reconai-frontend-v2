// lib/api/endpoints.ts
// Centralized backend endpoints used by the frontend.
// Keeps routes consistent across components/pages.

export const API_ENDPOINTS = {
  cfoSnapshot: "/api/cfo/snapshot",
  upload: "/api/upload",
  transactions: "/api/transactions",
  exportCsv: "/api/export",
  // Domain-specific intelligence endpoints
  coreIntelligence: "/api/core/intelligence",
  cfoIntelligence: "/api/cfo/intelligence",
  payrollIntelligence: "/api/payroll/intelligence",
  govconIntelligence: "/api/govcon/intelligence",
} as const;
