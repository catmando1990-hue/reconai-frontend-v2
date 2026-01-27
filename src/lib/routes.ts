/**
 * Canonical Route Map
 * Single source of truth for all dashboard routes.
 * Use these constants instead of hardcoded strings.
 */

export const ROUTES = {
  // Home
  HOME: "/home",

  // Core
  CORE: "/core-dashboard",
  CORE_TRANSACTIONS: "/core/transactions",
  CORE_REPORTS: "/core/reports",
  CORE_OVERVIEW: "/core/overview",

  // Accounts & Banking
  ACCOUNTS: "/accounts",
  CONNECT_BANK: "/connect-bank",
  UPLOAD: "/upload",
  DOCUMENTS: "/documents",
  STATEMENTS: "/core/statements",

  // Intelligence
  INTELLIGENCE: "/intelligence-dashboard",
  INTELLIGENCE_INSIGHTS: "/intelligence/insights",
  INTELLIGENCE_ALERTS: "/intelligence/alerts",
  INTELLIGENCE_AI_WORKER: "/intelligence/ai-worker",

  // CFO
  CFO: "/cfo-dashboard",
  CFO_OVERVIEW: "/cfo/overview",
  CFO_EXECUTIVE_SUMMARY: "/cfo/executive-summary",
  CFO_COMPLIANCE: "/cfo/compliance",
  CFO_FINANCIAL_REPORTS: "/financial-reports",
  CFO_CASH_FLOW: "/cash-flow",

  // Payroll
  PAYROLL: "/payroll-dashboard",
  PAYROLL_OVERVIEW: "/payroll/overview",
  PAYROLL_PEOPLE: "/payroll/people",
  PAYROLL_EMPLOYEES: "/payroll/people/employees",
  PAYROLL_CONTRACTORS: "/payroll/people/contractors",
  PAYROLL_COMPENSATION: "/payroll/compensation",
  PAYROLL_TIME_LABOR: "/payroll/time-labor",
  PAYROLL_PAY_RUNS: "/payroll/pay-runs",
  PAYROLL_TAXES: "/payroll/taxes",
  PAYROLL_BENEFITS: "/payroll/benefits",
  PAYROLL_ACCOUNTING: "/payroll/accounting",
  PAYROLL_COMPLIANCE: "/payroll/compliance",
  PAYROLL_AUDIT_TRAIL: "/payroll/audit-trail",
  PAYROLL_SNAPSHOTS: "/payroll/snapshots",
  PAYROLL_REPORTS: "/payroll/reports",
  PAYROLL_SETTINGS: "/payroll/settings",

  // GovCon
  GOVCON: "/govcon",
  GOVCON_CONTRACTS: "/govcon/contracts",
  GOVCON_TIMEKEEPING: "/govcon/timekeeping",
  GOVCON_INDIRECTS: "/govcon/indirects",
  GOVCON_RECONCILIATION: "/govcon/reconciliation",
  GOVCON_AUDIT: "/govcon/audit",
  GOVCON_AUDIT_VERIFY: "/govcon/audit/verify",
  GOVCON_EVIDENCE: "/govcon/evidence",
  GOVCON_SF1408: "/govcon/sf-1408",

  // Settings
  SETTINGS: "/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type Route = (typeof ROUTES)[RouteKey];

/**
 * Helper to check if a route exists in our canonical map
 */
export function isValidRoute(path: string): path is Route {
  return Object.values(ROUTES).includes(path as Route);
}
