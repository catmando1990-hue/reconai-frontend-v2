// ReconAI BUILD 24
// Lightweight command registry used by the desktop-first command palette.
// Dependency-free (no heavy fuzzy libs) for performance.

export type CommandGroup =
  | "Navigate"
  | "Core"
  | "Intelligence"
  | "CFO"
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
    href: "/dashboard",
    verbs: ["go", "open"],
  },

  // Core
  {
    id: "go-core-overview",
    label: "Go to Core → Overview",
    group: "Core",
    hint: "Navigation",
    keywords: ["core", "summary", "snapshot"],
    href: "/dashboard/core/overview",
    verbs: ["go", "open"],
  },
  {
    id: "go-core-transactions",
    label: "Go to Core → Transactions",
    group: "Core",
    hint: "Navigation",
    keywords: ["transactions", "ledger", "imports"],
    href: "/dashboard/core/transactions",
    verbs: ["go", "open"],
  },
  {
    id: "go-core-reports",
    label: "Go to Core → Reports",
    group: "Core",
    hint: "Navigation",
    keywords: ["reports", "exports", "statements"],
    href: "/dashboard/core/reports",
    verbs: ["go", "open"],
  },

  // Intelligence
  {
    id: "go-intel-insights",
    label: "Go to Intelligence → Insights",
    group: "Intelligence",
    hint: "Manual run",
    keywords: ["intelligence", "advisory", "run"],
    href: "/dashboard/intelligence/insights",
    verbs: ["go", "open", "run"],
  },
  {
    id: "go-intel-alerts",
    label: "Go to Intelligence → Alerts",
    group: "Intelligence",
    hint: "Signals",
    keywords: ["signals", "alerts", "risk"],
    href: "/dashboard/intelligence/alerts",
    verbs: ["go", "open"],
  },

  // CFO
  {
    id: "go-cfo-overview",
    label: "Go to CFO → Overview",
    group: "CFO",
    hint: "Navigation",
    keywords: ["cfo", "overview", "kpis"],
    href: "/dashboard/cfo/overview",
    verbs: ["go", "open"],
  },
  {
    id: "go-cfo-compliance",
    label: "Go to CFO → Compliance",
    group: "CFO",
    hint: "Read-only",
    keywords: ["compliance", "audit", "controls"],
    href: "/dashboard/cfo/compliance",
    verbs: ["go", "open"],
  },

  // Settings
  {
    id: "go-settings",
    label: "Go to Settings",
    group: "Settings",
    hint: "Preferences",
    keywords: ["settings", "preferences", "profile"],
    href: "/dashboard/settings",
    verbs: ["go", "open"],
  },
];
