/**
 * Canonical Navigation Map for Dashboard UI
 *
 * Single source of truth for page titles, breadcrumbs, and navigation labels.
 * Ensures consistent naming across sidebar, headers, and breadcrumbs.
 *
 * RULES:
 * - displayTitle: Full page title shown in RouteShell
 * - shortLabel: Abbreviated label for sidebar (max ~12 chars)
 * - breadcrumb: Array of [label, route] tuples for breadcrumb trail
 * - module: Parent module key for grouping
 * - order: Explicit ordering within module (lower = first)
 */

import { ROUTES, type Route } from "./routes";

// ============================================
// TYPES
// ============================================

export type ModuleKey =
  | "home"
  | "core"
  | "intelligence"
  | "cfo"
  | "govcon"
  | "settings";

export interface NavEntry {
  /** Full display title for page header */
  displayTitle: string;
  /** Short label for sidebar navigation */
  shortLabel: string;
  /** Subtitle/description for page header */
  subtitle?: string;
  /** Parent module this page belongs to */
  module: ModuleKey;
  /** Breadcrumb trail: [[label, route], ...] */
  breadcrumb: Array<[string, Route | null]>;
  /** Icon name from lucide-react (for reference) */
  icon?: string;
  /** Explicit ordering within module (lower = first) */
  order: number;
}

// ============================================
// CANONICAL NAVIGATION MAP
// ============================================

export const NAV: Record<Route, NavEntry> = {
  // ─────────────────────────────────────────
  // HOME
  // ─────────────────────────────────────────
  [ROUTES.HOME]: {
    displayTitle: "Home",
    shortLabel: "Home",
    subtitle: "Your operational dashboard",
    module: "home",
    breadcrumb: [["Home", null]],
    icon: "Home",
    order: 0,
  },

  // ─────────────────────────────────────────
  // CORE MODULE
  // ─────────────────────────────────────────
  [ROUTES.CORE]: {
    displayTitle: "Core",
    shortLabel: "Core",
    subtitle: "Structured financial reality. Your operational foundation.",
    module: "core",
    breadcrumb: [["Core", null]],
    icon: "Database",
    order: 0,
  },
  [ROUTES.CORE_TRANSACTIONS]: {
    displayTitle: "Transactions",
    shortLabel: "Transactions",
    subtitle: "View and categorize financial transactions",
    module: "core",
    breadcrumb: [
      ["Core", ROUTES.CORE],
      ["Transactions", null],
    ],
    icon: "ArrowLeftRight",
    order: 1,
  },
  [ROUTES.CORE_REPORTS]: {
    displayTitle: "Reports",
    shortLabel: "Reports",
    subtitle: "Financial reports and analytics",
    module: "core",
    breadcrumb: [
      ["Core", ROUTES.CORE],
      ["Reports", null],
    ],
    icon: "BarChart3",
    order: 2,
  },
  [ROUTES.CORE_OVERVIEW]: {
    displayTitle: "Overview",
    shortLabel: "Overview",
    subtitle: "Core module summary",
    module: "core",
    breadcrumb: [
      ["Core", ROUTES.CORE],
      ["Overview", null],
    ],
    icon: "LayoutDashboard",
    order: 3,
  },

  // ─────────────────────────────────────────
  // ACCOUNTS & BANKING
  // ─────────────────────────────────────────
  [ROUTES.ACCOUNTS]: {
    displayTitle: "Accounts",
    shortLabel: "Accounts",
    subtitle: "Connected bank accounts and balances",
    module: "core",
    breadcrumb: [
      ["Core", ROUTES.CORE],
      ["Accounts", null],
    ],
    icon: "Building2",
    order: 4,
  },
  [ROUTES.CONNECT_BANK]: {
    displayTitle: "Connect Bank",
    shortLabel: "Connect",
    subtitle: "Link a new bank account",
    module: "core",
    breadcrumb: [
      ["Core", ROUTES.CORE],
      ["Connect Bank", null],
    ],
    icon: "Link2",
    order: 5,
  },
  [ROUTES.UPLOAD]: {
    displayTitle: "Upload",
    shortLabel: "Upload",
    subtitle: "Import bank statements and data",
    module: "core",
    breadcrumb: [
      ["Core", ROUTES.CORE],
      ["Upload", null],
    ],
    icon: "Upload",
    order: 6,
  },

  // ─────────────────────────────────────────
  // INTELLIGENCE MODULE
  // ─────────────────────────────────────────
  [ROUTES.INTELLIGENCE]: {
    displayTitle: "Intelligence",
    shortLabel: "Intelligence",
    subtitle: "AI-powered signals and workflow assistance",
    module: "intelligence",
    breadcrumb: [["Intelligence", null]],
    icon: "Brain",
    order: 0,
  },
  [ROUTES.INTELLIGENCE_INSIGHTS]: {
    displayTitle: "Insights",
    shortLabel: "Insights",
    subtitle: "Decision-grade signals from transaction patterns",
    module: "intelligence",
    breadcrumb: [
      ["Intelligence", ROUTES.INTELLIGENCE],
      ["Insights", null],
    ],
    icon: "Sparkles",
    order: 1,
  },
  [ROUTES.INTELLIGENCE_ALERTS]: {
    displayTitle: "Alerts",
    shortLabel: "Alerts",
    subtitle: "Signals requiring review or documentation",
    module: "intelligence",
    breadcrumb: [
      ["Intelligence", ROUTES.INTELLIGENCE],
      ["Alerts", null],
    ],
    icon: "Bell",
    order: 2,
  },
  [ROUTES.INTELLIGENCE_AI_WORKER]: {
    displayTitle: "AI Worker",
    shortLabel: "AI Worker",
    subtitle: "Structured assistance for repeatable workflows",
    module: "intelligence",
    breadcrumb: [
      ["Intelligence", ROUTES.INTELLIGENCE],
      ["AI Worker", null],
    ],
    icon: "Bot",
    order: 3,
  },

  // ─────────────────────────────────────────
  // CFO MODULE
  // ─────────────────────────────────────────
  [ROUTES.CFO]: {
    displayTitle: "CFO",
    shortLabel: "CFO",
    subtitle: "Executive financial oversight and reporting",
    module: "cfo",
    breadcrumb: [["CFO", null]],
    icon: "Briefcase",
    order: 0,
  },
  [ROUTES.CFO_EXECUTIVE_SUMMARY]: {
    displayTitle: "Executive Summary",
    shortLabel: "Summary",
    subtitle: "High-level financial metrics and KPIs",
    module: "cfo",
    breadcrumb: [
      ["CFO", ROUTES.CFO],
      ["Executive Summary", null],
    ],
    icon: "FileText",
    order: 1,
  },
  [ROUTES.CFO_FINANCIAL_REPORTS]: {
    displayTitle: "Financial Reports",
    shortLabel: "Reports",
    subtitle: "Detailed financial statements and analysis",
    module: "cfo",
    breadcrumb: [
      ["CFO", ROUTES.CFO],
      ["Financial Reports", null],
    ],
    icon: "BarChart3",
    order: 2,
  },
  [ROUTES.CFO_CASH_FLOW]: {
    displayTitle: "Cash Flow",
    shortLabel: "Cash Flow",
    subtitle: "Cash position and projections",
    module: "cfo",
    breadcrumb: [
      ["CFO", ROUTES.CFO],
      ["Cash Flow", null],
    ],
    icon: "TrendingUp",
    order: 3,
  },
  [ROUTES.CFO_COMPLIANCE]: {
    displayTitle: "Compliance",
    shortLabel: "Compliance",
    subtitle: "Regulatory compliance status and tracking",
    module: "cfo",
    breadcrumb: [
      ["CFO", ROUTES.CFO],
      ["Compliance", null],
    ],
    icon: "Shield",
    order: 4,
  },
  [ROUTES.CFO_OVERVIEW]: {
    displayTitle: "Overview",
    shortLabel: "Overview",
    subtitle: "CFO module summary",
    module: "cfo",
    breadcrumb: [
      ["CFO", ROUTES.CFO],
      ["Overview", null],
    ],
    icon: "LayoutDashboard",
    order: 5,
  },

  // ─────────────────────────────────────────
  // GOVCON MODULE
  // ─────────────────────────────────────────
  [ROUTES.GOVCON]: {
    displayTitle: "GovCon",
    shortLabel: "GovCon",
    subtitle: "DCAA-compliant government contracting workspace",
    module: "govcon",
    breadcrumb: [["GovCon", null]],
    icon: "Building",
    order: 0,
  },
  [ROUTES.GOVCON_CONTRACTS]: {
    displayTitle: "Contracts",
    shortLabel: "Contracts",
    subtitle: "Government contract management",
    module: "govcon",
    breadcrumb: [
      ["GovCon", ROUTES.GOVCON],
      ["Contracts", null],
    ],
    icon: "FileText",
    order: 1,
  },
  [ROUTES.GOVCON_TIMEKEEPING]: {
    displayTitle: "Timekeeping",
    shortLabel: "Timekeeping",
    subtitle: "Daily labor tracking and allocation",
    module: "govcon",
    breadcrumb: [
      ["GovCon", ROUTES.GOVCON],
      ["Timekeeping", null],
    ],
    icon: "Clock",
    order: 2,
  },
  [ROUTES.GOVCON_INDIRECTS]: {
    displayTitle: "Indirect Costs",
    shortLabel: "Indirects",
    subtitle: "Overhead, G&A, and fringe cost pools",
    module: "govcon",
    breadcrumb: [
      ["GovCon", ROUTES.GOVCON],
      ["Indirect Costs", null],
    ],
    icon: "Layers",
    order: 3,
  },
  [ROUTES.GOVCON_RECONCILIATION]: {
    displayTitle: "Reconciliation",
    shortLabel: "Reconcile",
    subtitle: "Labor and cost reconciliation",
    module: "govcon",
    breadcrumb: [
      ["GovCon", ROUTES.GOVCON],
      ["Reconciliation", null],
    ],
    icon: "ArrowLeftRight",
    order: 4,
  },
  [ROUTES.GOVCON_AUDIT]: {
    displayTitle: "Audit Trail",
    shortLabel: "Audit",
    subtitle: "Audit log with hash chain integrity for DCAA documentation",
    module: "govcon",
    breadcrumb: [
      ["GovCon", ROUTES.GOVCON],
      ["Audit Trail", null],
    ],
    icon: "Shield",
    order: 5,
  },
  [ROUTES.GOVCON_AUDIT_VERIFY]: {
    displayTitle: "Verify Hash Chain",
    shortLabel: "Verify",
    subtitle: "Cryptographic verification of audit integrity",
    module: "govcon",
    breadcrumb: [
      ["GovCon", ROUTES.GOVCON],
      ["Audit Trail", ROUTES.GOVCON_AUDIT],
      ["Verify", null],
    ],
    icon: "Hash",
    order: 6,
  },
  [ROUTES.GOVCON_EVIDENCE]: {
    displayTitle: "Evidence Viewer",
    shortLabel: "Evidence",
    subtitle: "Supporting documentation and attachments",
    module: "govcon",
    breadcrumb: [
      ["GovCon", ROUTES.GOVCON],
      ["Evidence", null],
    ],
    icon: "Eye",
    order: 7,
  },
  [ROUTES.GOVCON_SF1408]: {
    displayTitle: "SF-1408 Checklist",
    shortLabel: "SF-1408",
    subtitle: "Pre-award accounting system survey",
    module: "govcon",
    breadcrumb: [
      ["GovCon", ROUTES.GOVCON],
      ["SF-1408", null],
    ],
    icon: "ClipboardList",
    order: 8,
  },

  // ─────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────
  [ROUTES.SETTINGS]: {
    displayTitle: "Settings",
    shortLabel: "Settings",
    subtitle: "Account preferences and configuration",
    module: "settings",
    breadcrumb: [["Settings", null]],
    icon: "Settings",
    order: 0,
  },
} as const;

// ============================================
// MODULE METADATA
// ============================================

export interface ModuleInfo {
  displayTitle: string;
  shortLabel: string;
  description: string;
  landingRoute: Route;
  icon: string;
}

export const MODULES: Record<ModuleKey, ModuleInfo> = {
  home: {
    displayTitle: "Home",
    shortLabel: "Home",
    description: "Your operational dashboard",
    landingRoute: ROUTES.HOME,
    icon: "Home",
  },
  core: {
    displayTitle: "Core",
    shortLabel: "Core",
    description: "Structured financial reality",
    landingRoute: ROUTES.CORE,
    icon: "Database",
  },
  intelligence: {
    displayTitle: "Intelligence",
    shortLabel: "Intel",
    description: "AI-powered signals and workflows",
    landingRoute: ROUTES.INTELLIGENCE,
    icon: "Brain",
  },
  cfo: {
    displayTitle: "CFO",
    shortLabel: "CFO",
    description: "Executive financial oversight",
    landingRoute: ROUTES.CFO,
    icon: "Briefcase",
  },
  govcon: {
    displayTitle: "GovCon",
    shortLabel: "GovCon",
    description: "DCAA-compliant contracting",
    landingRoute: ROUTES.GOVCON,
    icon: "Building",
  },
  settings: {
    displayTitle: "Settings",
    shortLabel: "Settings",
    description: "Account configuration",
    landingRoute: ROUTES.SETTINGS,
    icon: "Settings",
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get navigation entry for a route.
 * Returns undefined if route not found.
 */
export function getNavEntry(route: Route): NavEntry | undefined {
  return NAV[route];
}

/**
 * Get navigation entry for a pathname string.
 * Returns undefined if not found.
 */
export function getNavEntryByPathname(pathname: string): NavEntry | undefined {
  return NAV[pathname as Route];
}

/**
 * Get all routes for a given module, sorted by order.
 */
export function getModuleRoutes(module: ModuleKey): Route[] {
  return (Object.entries(NAV) as [Route, NavEntry][])
    .filter(([, entry]) => entry.module === module)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([route]) => route);
}

/**
 * Get display title for a route.
 * Falls back to the route path if not found.
 */
export function getDisplayTitle(route: Route): string {
  return NAV[route]?.displayTitle ?? route;
}

/**
 * Get subtitle for a route.
 */
export function getSubtitle(route: Route): string | undefined {
  return NAV[route]?.subtitle;
}

/**
 * Get breadcrumb trail for a route.
 * Returns array of [label, route | null] tuples.
 */
export function getBreadcrumb(route: Route): Array<[string, Route | null]> {
  return NAV[route]?.breadcrumb ?? [[route, null]];
}

/**
 * Get sibling routes (same module, excluding self), sorted by order.
 */
export function getSiblingRoutes(route: Route): Route[] {
  const entry = NAV[route];
  if (!entry) return [];
  return getModuleRoutes(entry.module).filter((r) => r !== route);
}

/**
 * Get child routes (routes that have this route in their breadcrumb), sorted by order.
 */
export function getChildRoutes(parentRoute: Route): Route[] {
  return (Object.entries(NAV) as [Route, NavEntry][])
    .filter(([route, entry]) => {
      if (route === parentRoute) return false;
      return entry.breadcrumb.some(([, r]) => r === parentRoute);
    })
    .sort((a, b) => a[1].order - b[1].order)
    .map(([route]) => route);
}

/**
 * Check if a route is a module landing page (order === 0 or breadcrumb.length === 1).
 */
export function isModuleLanding(route: Route): boolean {
  const entry = NAV[route];
  if (!entry) return false;
  return entry.breadcrumb.length === 1;
}

/**
 * Get module key for a given route.
 */
export function getModuleKey(route: Route): ModuleKey | undefined {
  return NAV[route]?.module;
}
