// lib/api/endpoints.ts
// Centralized backend endpoints used by the frontend.
// Keeps routes consistent across components/pages.

export const API_ENDPOINTS = {
  cfoSnapshot: "/api/cfo/snapshot",
  upload: "/api/upload",
  transactions: "/api/transactions",
  insights: "/api/intelligence/insights",
  exportCsv: "/api/export",
} as const;
