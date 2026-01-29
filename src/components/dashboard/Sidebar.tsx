"use client";

import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Brain,
  Database,
  Sparkles,
  Briefcase,
  Wallet,
  Building,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useUserProfile } from "@/lib/user-profile-context";
import {
  hasGovConEntitlement,
  hasPayrollEntitlement,
} from "@/lib/entitlements";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface SubRoute {
  id: string;
  label: string;
  href: string;
}

interface Module {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  href: string;
  children: SubRoute[];
}

// =============================================================================
// MODULE CONFIGURATION
// =============================================================================

const MODULES: Module[] = [
  {
    id: "home",
    label: "Home",
    shortLabel: "Home",
    icon: LayoutDashboard,
    href: ROUTES.HOME,
    children: [],
  },
  {
    id: "core",
    label: "Core",
    shortLabel: "Core",
    icon: Database,
    href: ROUTES.CORE,
    children: [
      { id: "overview", label: "Overview", href: ROUTES.CORE_OVERVIEW },
      {
        id: "transactions",
        label: "Transactions",
        href: ROUTES.CORE_TRANSACTIONS,
      },
      { id: "accounts", label: "Accounts", href: ROUTES.CORE_ACCOUNTS },
      { id: "reports", label: "Reports", href: ROUTES.CORE_REPORTS },
      { id: "statements", label: "Statements", href: ROUTES.CORE_STATEMENTS },
      { id: "connect", label: "Bank Connections", href: ROUTES.CORE_CONNECT },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    shortLabel: "Intel",
    icon: Sparkles,
    href: ROUTES.INTELLIGENCE,
    children: [
      { id: "overview", label: "Overview", href: ROUTES.INTELLIGENCE_OVERVIEW },
      { id: "insights", label: "Insights", href: ROUTES.INTELLIGENCE_INSIGHTS },
      { id: "alerts", label: "Alerts", href: ROUTES.INTELLIGENCE_ALERTS },
      {
        id: "ai-worker",
        label: "AI Worker",
        href: ROUTES.INTELLIGENCE_AI_WORKER,
      },
    ],
  },
  {
    id: "cfo",
    label: "CFO",
    shortLabel: "CFO",
    icon: Briefcase,
    href: ROUTES.CFO,
    children: [
      { id: "overview", label: "Overview", href: ROUTES.CFO_OVERVIEW },
      {
        id: "executive-summary",
        label: "Executive Summary",
        href: ROUTES.CFO_EXECUTIVE_SUMMARY,
      },
      { id: "cash-flow", label: "Cash Flow", href: ROUTES.CFO_CASH_FLOW },
      { id: "compliance", label: "Compliance", href: ROUTES.CFO_COMPLIANCE },
      { id: "reports", label: "Reports", href: ROUTES.CFO_REPORTS },
      { id: "connect", label: "Bank Connections", href: ROUTES.CFO_CONNECT },
    ],
  },
  {
    id: "payroll",
    label: "Payroll",
    shortLabel: "Payroll",
    icon: Wallet,
    href: ROUTES.PAYROLL,
    children: [
      { id: "overview", label: "Overview", href: ROUTES.PAYROLL_OVERVIEW },
      { id: "people", label: "People", href: ROUTES.PAYROLL_PEOPLE },
      {
        id: "compensation",
        label: "Compensation",
        href: ROUTES.PAYROLL_COMPENSATION,
      },
      {
        id: "time-labor",
        label: "Time & Labor",
        href: ROUTES.PAYROLL_TIME_LABOR,
      },
      { id: "pay-runs", label: "Pay Runs", href: ROUTES.PAYROLL_PAY_RUNS },
      { id: "taxes", label: "Taxes", href: ROUTES.PAYROLL_TAXES },
      { id: "benefits", label: "Benefits", href: ROUTES.PAYROLL_BENEFITS },
      {
        id: "connect",
        label: "Bank Connections",
        href: ROUTES.PAYROLL_CONNECT,
      },
    ],
  },
  {
    id: "govcon",
    label: "GovCon",
    shortLabel: "GovCon",
    icon: Building,
    href: ROUTES.GOVCON,
    children: [
      { id: "contracts", label: "Contracts", href: ROUTES.GOVCON_CONTRACTS },
      {
        id: "timekeeping",
        label: "Timekeeping",
        href: ROUTES.GOVCON_TIMEKEEPING,
      },
      {
        id: "indirects",
        label: "Indirect Costs",
        href: ROUTES.GOVCON_INDIRECTS,
      },
      {
        id: "reconciliation",
        label: "Reconciliation",
        href: ROUTES.GOVCON_RECONCILIATION,
      },
      { id: "audit", label: "Audit Trail", href: ROUTES.GOVCON_AUDIT },
      { id: "sf-1408", label: "SF-1408", href: ROUTES.GOVCON_SF1408 },
      { id: "connect", label: "Bank Connections", href: ROUTES.GOVCON_CONNECT },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings,
    href: ROUTES.SETTINGS,
    children: [],
  },
];

// =============================================================================
// HELPER: Determine active module from pathname
// =============================================================================

function getActiveModule(pathname: string): string | null {
  if (pathname.startsWith("/home")) return "home";
  if (
    pathname.startsWith("/core") ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/connect-bank") ||
    pathname.startsWith("/upload")
  )
    return "core";
  if (pathname.startsWith("/intelligence")) return "intelligence";
  if (
    pathname.startsWith("/cfo") ||
    pathname.startsWith("/cash-flow") ||
    pathname.startsWith("/financial-reports")
  )
    return "cfo";
  if (pathname.startsWith("/payroll")) return "payroll";
  if (pathname.startsWith("/govcon")) return "govcon";
  if (pathname.startsWith("/settings")) return "settings";
  return null;
}

// =============================================================================
// ICON RAIL BUTTON
// =============================================================================

interface IconButtonProps {
  module: Module;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function IconButton({
  module,
  isActive,
  isSelected,
  onClick,
}: IconButtonProps) {
  const Icon = module.icon;

  return (
    <button
      onClick={onClick}
      title={module.label}
      className={cn(
        "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isSelected
          ? "bg-primary/20 text-primary shadow-lg shadow-primary/10"
          : isActive
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="w-5 h-5" />
      {/* Active indicator dot */}
      {isActive && !isSelected && (
        <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary" />
      )}
    </button>
  );
}

// =============================================================================
// EXPANDED PANEL
// =============================================================================

interface ExpandedPanelProps {
  module: Module;
  pathname: string;
  onClose: () => void;
}

function ExpandedPanel({ module, pathname, onClose }: ExpandedPanelProps) {
  return (
    <div className="w-52 bg-card border-r border-border flex flex-col animate-in slide-in-from-left-2 duration-200">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <span className="font-semibold text-foreground">{module.label}</span>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-routes */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {module.children.map((child) => {
          const isActive =
            pathname === child.href || pathname.startsWith(child.href + "/");

          return (
            <Link
              key={child.id}
              href={child.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {child.label}
            </Link>
          );
        })}
      </nav>

      {/* Module overview link at bottom */}
      <div className="p-2 border-t border-border">
        <Link
          href={module.href}
          className="flex items-center justify-center px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          View {module.label} Overview
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN SIDEBAR COMPONENT
// =============================================================================

export function Sidebar() {
  const pathname = usePathname() || "";
  const { signOut } = useClerk();
  const { profile } = useUserProfile();

  // State for selected module (panel visibility)
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Entitlements
  const showGovCon = useMemo(
    () => hasGovConEntitlement(profile?.tiers, profile?.role),
    [profile?.tiers, profile?.role],
  );
  const showPayroll = useMemo(
    () => hasPayrollEntitlement(profile?.tiers, profile?.role),
    [profile?.tiers, profile?.role],
  );

  // Filter modules based on entitlements
  const visibleModules = useMemo(() => {
    return MODULES.filter((mod) => {
      if (mod.id === "govcon" && !showGovCon) return false;
      if (mod.id === "payroll" && !showPayroll) return false;
      return true;
    });
  }, [showGovCon, showPayroll]);

  // Current active module based on pathname
  const activeModuleId = getActiveModule(pathname);

  // Get selected module data
  const selectedModuleData = useMemo(() => {
    return MODULES.find((m) => m.id === selectedModule) || null;
  }, [selectedModule]);

  // Handle module click
  const handleModuleClick = useCallback(
    (moduleId: string) => {
      const mod = MODULES.find((m) => m.id === moduleId);

      if (!mod) return;

      // If module has no children, navigate directly
      if (mod.children.length === 0) {
        setSelectedModule(null);
        // Navigation handled by Link wrapper
        return;
      }

      // Toggle panel
      if (selectedModule === moduleId) {
        setSelectedModule(null);
      } else {
        setSelectedModule(moduleId);
      }
    },
    [selectedModule],
  );

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="flex h-full">
      {/* Icon Rail */}
      <div className="w-16 bg-background border-r border-border flex flex-col items-center py-4">
        {/* Logo */}
        <Link
          href="/"
          className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 hover:border-primary/40 transition-colors"
          title="ReconAI"
        >
          <Brain className="w-5 h-5 text-primary" />
        </Link>

        {/* Module Icons */}
        <nav className="flex-1 flex flex-col items-center gap-1">
          {visibleModules.map((mod) => {
            const isActive = activeModuleId === mod.id;
            const isSelected = selectedModule === mod.id;

            // Modules without children get wrapped in Link
            if (mod.children.length === 0) {
              return (
                <Link key={mod.id} href={mod.href}>
                  <IconButton
                    module={mod}
                    isActive={isActive}
                    isSelected={isSelected}
                    onClick={() => setSelectedModule(null)}
                  />
                </Link>
              );
            }

            return (
              <IconButton
                key={mod.id}
                module={mod}
                isActive={isActive}
                isSelected={isSelected}
                onClick={() => handleModuleClick(mod.id)}
              />
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-1 pt-4 border-t border-border mt-4">
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expanded Panel (conditionally rendered) */}
      {selectedModuleData && selectedModuleData.children.length > 0 && (
        <ExpandedPanel
          module={selectedModuleData}
          pathname={pathname}
          onClose={() => setSelectedModule(null)}
        />
      )}
    </aside>
  );
}

export default Sidebar;
