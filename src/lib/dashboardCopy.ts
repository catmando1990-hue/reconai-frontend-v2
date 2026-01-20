/**
 * Canonical Copy Map for Dashboard UI
 *
 * Centralized source of truth for all dashboard status labels,
 * empty-state messages, and CTA text. Ensures consistent language
 * across the enterprise control plane.
 *
 * RULES:
 * - No compliance claims unless strictly validated
 * - No traction claims or fake metrics
 * - Neutral language for unverified states
 * - Honest empty states (not "coming soon" or placeholders)
 */

// ============================================
// STATUS LABELS
// ============================================

export const STATUS = {
  /** Data source not connected */
  NOT_CONFIGURED: "Not configured",
  /** Analysis has not been run */
  NOT_EVALUATED: "Not evaluated",
  /** Setup required before use */
  REQUIRES_SETUP: "Requires setup",
  /** No data available */
  NO_DATA: "No data",
  /** Data is being processed */
  PROCESSING: "Processing",
  /** Action pending user input */
  PENDING: "Pending",
  /** Feature available but inactive */
  INACTIVE: "Inactive",
  /** Feature active and operational */
  ACTIVE: "Active",
  /** Unknown or indeterminate state */
  UNKNOWN: "Unknown",
} as const;

// ============================================
// EMPTY STATE COPY
// ============================================

export const EMPTY_STATE = {
  // Core / Transactions
  transactions: {
    title: "No transactions",
    description: "Connect a bank account or upload data to see transactions.",
  },
  reports: {
    title: "No reports available",
    description: "Reports will appear here once transaction data is imported.",
  },

  // Intelligence / Signals
  signals: {
    title: "No signals detected",
    description: "Signals will appear here after analysis is run on your data.",
  },
  insights: {
    title: "No insights available",
    description: "Run an analysis to generate insights from your data.",
  },
  alerts: {
    title: "No alerts",
    description: "Alerts will appear here when anomalies are detected.",
  },
  aiWorker: {
    title: "No tasks queued",
    description: "AI worker tasks will appear here when analysis is requested.",
  },

  // GovCon Modules
  govcon: {
    title: "GovCon module not configured",
    description:
      "Configure your contract and compliance settings to get started.",
  },
  contracts: {
    title: "No contracts",
    description: "Add contracts to track compliance and billing.",
  },
  timekeeping: {
    title: "No time entries",
    description: "Time entries will appear here once recorded.",
  },
  indirects: {
    title: "No indirect costs",
    description: "Indirect cost pools will appear here once configured.",
  },
  reconciliation: {
    title: "No reconciliation data",
    description: "Reconciliation entries will appear after data is imported.",
  },
  audit: {
    title: "No audit records",
    description: "Audit trail entries will appear here as actions are taken.",
  },
  evidence: {
    title: "No evidence collected",
    description: "Evidence files will appear here once uploaded or generated.",
  },

  // CFO / Financial
  cashFlow: {
    title: "No cash flow data",
    description:
      "Cash flow metrics will appear once transactions are imported.",
  },
  financialReports: {
    title: "No financial reports",
    description:
      "Financial reports will be generated from your transaction data.",
  },
  compliance: {
    title: "No compliance data",
    description: "Compliance status will appear after configuration.",
  },

  // Settings / Diagnostics
  diagnostics: {
    title: "No diagnostics available",
    description: "Run a diagnostic check to see system status.",
  },
  dataSources: {
    title: "No data sources connected",
    description: "Connect a bank account or upload files to get started.",
  },

  // Generic fallback
  generic: {
    title: "No data available",
    description: "Data will appear here once configured.",
  },
} as const;

// ============================================
// CTA LABELS
// ============================================

export const CTA = {
  /** Primary action to connect bank */
  CONNECT_BANK: "Connect bank",
  /** Generic configuration action */
  CONFIGURE: "Configure",
  /** Run analysis action */
  RUN_ANALYSIS: "Run analysis",
  /** Learn more / documentation link */
  LEARN_MORE: "Learn more",
  /** Upload data action */
  UPLOAD_DATA: "Upload data",
  /** View details action */
  VIEW_DETAILS: "View details",
  /** Refresh / retry action */
  REFRESH: "Refresh",
  /** Get started action */
  GET_STARTED: "Get started",
  /** Add new item action */
  ADD_NEW: "Add new",
} as const;

// ============================================
// PANEL TITLES (Standardized)
// ============================================

export const PANEL_TITLE = {
  quickAccess: "Quick access",
  systemStatus: "System status",
  recentActivity: "Recent activity",
  workQueue: "Work queue",
  summary: "Summary",
  details: "Details",
  actions: "Actions",
  settings: "Settings",
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get empty state copy for a given module key.
 * Falls back to generic if key not found.
 */
export function getEmptyState(key: keyof typeof EMPTY_STATE) {
  return EMPTY_STATE[key] ?? EMPTY_STATE.generic;
}

/**
 * Format a status for display with optional count.
 * Returns "No data" style for zero/null counts.
 */
export function formatStatusCount(
  count: number | null | undefined,
  singular: string,
  plural?: string,
): string {
  if (count === null || count === undefined) {
    return STATUS.NO_DATA;
  }
  if (count === 0) {
    return `No ${plural ?? singular}s`;
  }
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}
