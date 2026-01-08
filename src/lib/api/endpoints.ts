// lib/api/endpoints.ts
// Centralized backend endpoints used by the frontend.
// Keeps routes consistent across components/pages.

export const API_ENDPOINTS = {
  cfoSnapshot: "/cfo/snapshot",
  upload: "/upload",
  transactions: "/transactions",
  insights: "/insights",
  exportCsv: "/export",
} as const;
