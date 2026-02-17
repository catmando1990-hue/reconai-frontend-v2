// ReconAI BUILD 24
// Lightweight command registry used by the desktop-first command palette.
// Dependency-free (no heavy fuzzy libs) for performance.

export type CommandGroup =
  | "Navigate"
  | "Core"
  | "CFO"
  | "Payroll"
  | "GovCon"
  | "Settings";

export type CommandDef = {
  id: string;
  label: string;
  group: CommandGroup;
  hint?: string;
  keywords?: string[];
  /** Navigation target (dashboard-only). */
  href?: string;
  /** Optional verb aliases (used by query parsing). */
  verbs?: string[];
};

/**
 * Default command set. Keep it small and high-signal.
 * Only dashboard routes. No background execution.
 */
export const DEFAULT_COMMANDS: CommandDef[] = [
  {
    id: "go-dashboard",
    label: "Go to Dashboard",
    group: "Navigate",
    hint: "Navigation",
    keywords: ["home", "overview"],
    href: "/accounts",
    verbs: ["go", "open"],
  },

  // Core
  {
    id: "go-core-overview",
    label: "Go to Core → Overview",
    group: "Core",
    hint: "Navigation",
    keywords: ["core", "summary", "snapshot"],
    href: "/core/overview",
    verbs: ["go", "open"],
  },
  {
    id: "go-core-transactions",
    label: "Go to Core → Transactions",
    group: "Core",
    hint: "Navigation",
    keywords: ["transactions", "ledger", "imports"],
    href: "/transactions",
    verbs: ["go", "open"],
  },
  {
    id: "go-core-reports",
    label: "Go to Core → Reports",
    group: "Core",
    hint: "Navigation",
    keywords: ["reports", "exports", "statements"],
    href: "/financial-reports",
    verbs: ["go", "open"],
  },

  // Domain-Specific Intelligence (Option B)
  {
    id: "go-core-intelligence",
    label: "Go to Core → Intelligence",
    group: "Core",
    hint: "AI Signals",
    keywords: ["intelligence", "core", "signals", "anomalies"],
    href: "/core/intelligence",
    verbs: ["go", "open"],
  },
  {
    id: "go-cfo-intelligence",
    label: "Go to CFO → Intelligence",
    group: "CFO",
    hint: "AI Signals",
    keywords: ["intelligence", "cfo", "signals", "runway", "forecast"],
    href: "/cfo/intelligence",
    verbs: ["go", "open"],
  },
  {
    id: "go-payroll-intelligence",
    label: "Go to Payroll → Intelligence",
    group: "Payroll",
    hint: "AI Signals",
    keywords: ["intelligence", "payroll", "signals", "variance"],
    href: "/payroll/intelligence",
    verbs: ["go", "open"],
  },
  {
    id: "go-govcon-intelligence",
    label: "Go to GovCon → Intelligence",
    group: "GovCon",
    hint: "DCAA Signals",
    keywords: ["intelligence", "govcon", "dcaa", "audit", "compliance"],
    href: "/govcon/intelligence",
    verbs: ["go", "open"],
  },

  // CFO
  {
    id: "go-cfo-overview",
    label: "Go to CFO → Overview",
    group: "CFO",
    hint: "Navigation",
    keywords: ["cfo", "overview", "kpis"],
    href: "/cfo/overview",
    verbs: ["go", "open"],
  },
  {
    id: "go-cfo-compliance",
    label: "Go to CFO → Compliance",
    group: "CFO",
    hint: "Read-only",
    keywords: ["compliance", "audit", "controls"],
    href: "/compliance",
    verbs: ["go", "open"],
  },

  // Settings
  {
    id: "go-settings",
    label: "Go to Settings",
    group: "Settings",
    hint: "Preferences",
    keywords: ["settings", "preferences", "profile"],
    href: "/settings",
    verbs: ["go", "open"],
  },
];
