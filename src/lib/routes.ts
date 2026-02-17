/**
 * Canonical Route Map
 * Single source of truth for all dashboard routes.
 * Use these constants instead of hardcoded strings.
 *
 * ROUTE STRUCTURE RULES:
 * - Module roots use the module name: /core, /cfo, /intelligence, /payroll, /govcon
 * - Sub-pages nest under modules: /core/transactions, /cfo/overview
 * - No redundant suffixes like -dashboard
 */

export const ROUTES = {
  // ─────────────────────────────────────────
  // HOME & GLOBAL
  // ─────────────────────────────────────────
  HOME: "/home",
  SETTINGS: "/settings",
  ACCOUNT: "/account",

  // ─────────────────────────────────────────
  // CORE MODULE
  // ─────────────────────────────────────────
  CORE: "/core",
  CORE_OVERVIEW: "/core/overview",
  CORE_TRANSACTIONS: "/core/transactions",
  CORE_ACCOUNTS: "/core/accounts",
  CORE_STATEMENTS: "/core/statements",
  CORE_REPORTS: "/core/reports",
  CORE_CONNECT: "/core/connect", // Core bank connections
  CORE_REPORTS_CASH_FLOW: "/core/reports/cash-flow",
  CORE_REPORTS_CATEGORY_SPEND: "/core/reports/category-spend",
  CORE_REPORTS_ACCOUNT_ACTIVITY: "/core/reports/account-activity",
  CORE_REPORTS_LEDGER: "/core/reports/ledger",

  // Banking Actions (legacy - redirect to CORE_CONNECT)
  CONNECT_BANK: "/connect-bank",
  UPLOAD: "/upload",
  DOCUMENTS: "/documents",
  STATEMENTS: "/core/statements", // Alias for CORE_STATEMENTS
  ACCOUNTS: "/core/accounts", // Alias for CORE_ACCOUNTS

  // ─────────────────────────────────────────
  // INTELLIGENCE MODULE
  // ─────────────────────────────────────────
  INTELLIGENCE: "/intelligence",
  INTELLIGENCE_OVERVIEW: "/intelligence/overview",
  INTELLIGENCE_INSIGHTS: "/intelligence/insights",
  INTELLIGENCE_ALERTS: "/intelligence/alerts",
  INTELLIGENCE_AI_WORKER: "/intelligence/ai-worker",

  // ─────────────────────────────────────────
  // CFO MODULE
  // ─────────────────────────────────────────
  CFO: "/cfo",
  CFO_OVERVIEW: "/cfo/overview",
  CFO_EXECUTIVE_SUMMARY: "/cfo/executive-summary",
  CFO_COMPLIANCE: "/cfo/compliance",
  CFO_CASH_FLOW: "/cfo/cash-flow",
  CFO_REPORTS: "/cfo/reports",
  CFO_FINANCIAL_REPORTS: "/cfo/reports", // Alias for CFO_REPORTS
  CFO_CONNECT: "/cfo/connect",

  // ─────────────────────────────────────────
  // PAYROLL MODULE
  // ─────────────────────────────────────────
  PAYROLL: "/payroll",
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
  PAYROLL_CONNECT: "/payroll/connect",

  // ─────────────────────────────────────────
  // GOVCON MODULE
  // ─────────────────────────────────────────
  GOVCON: "/govcon",
  GOVCON_OVERVIEW: "/govcon/overview",
  GOVCON_CONTRACTS: "/govcon/contracts",
  GOVCON_TIMEKEEPING: "/govcon/timekeeping",
  GOVCON_INDIRECTS: "/govcon/indirects",
  GOVCON_RECONCILIATION: "/govcon/reconciliation",
  GOVCON_AUDIT: "/govcon/audit",
  GOVCON_AUDIT_VERIFY: "/govcon/audit/verify",
  GOVCON_EVIDENCE: "/govcon/evidence",
  GOVCON_SF1408: "/govcon/sf-1408",
  GOVCON_CONNECT: "/govcon/connect",

  // ─────────────────────────────────────────
  // INVOICING MODULE
  // ─────────────────────────────────────────
  INVOICING: "/invoicing",
  INVOICING_NEW: "/invoicing/new",
  INVOICING_PREVIEW: "/invoicing/preview",
  INVOICING_SETTINGS: "/invoicing/settings",
  INVOICING_CUSTOMERS: "/invoicing/customers",
  INVOICING_VENDORS: "/invoicing/vendors",

  // ─────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────
  ADMIN_EXPORTS: "/admin/exports",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type Route = (typeof ROUTES)[RouteKey];

/**
 * Helper to check if a route exists in our canonical map
 */
export function isValidRoute(path: string): path is Route {
  return Object.values(ROUTES).includes(path as Route);
}

/**
 * Get the canonical route for a potentially legacy path
 */
export function getCanonicalRoute(path: string): string {
  const legacyMappings: Record<string, string> = {
    "/core-dashboard": ROUTES.CORE,
    "/cfo-dashboard": ROUTES.CFO,
    "/intelligence-dashboard": ROUTES.INTELLIGENCE,
    "/payroll-dashboard": ROUTES.PAYROLL,
    "/accounts": ROUTES.CORE_ACCOUNTS,
    "/cash-flow": ROUTES.CFO_CASH_FLOW,
    "/financial-reports": ROUTES.CFO_REPORTS,
    "/transactions": ROUTES.CORE_TRANSACTIONS,
    "/customers": ROUTES.INVOICING_CUSTOMERS,
    "/vendors": ROUTES.INVOICING_VENDORS,
    "/connect-bank": ROUTES.CORE_CONNECT, // Redirect legacy to new
  };
  return legacyMappings[path] || path;
}
