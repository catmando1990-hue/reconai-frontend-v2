"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  Brain,
  Database,
  Briefcase,
  Building,
  Settings,
  LogOut,
  Home,
  HelpCircle,
  LayoutDashboard,
  Sparkles,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { useUserProfile } from "@/lib/user-profile-context";
import { hasGovConEntitlement } from "@/lib/entitlements";
import { MODULES, type ModuleKey } from "@/lib/dashboardNav";

// ─────────────────────────────────────────────────────────────────────────────
// ICON MAPPING
// Maps dashboardNav icon strings to Lucide components
// ─────────────────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Home: LayoutDashboard,
  Database,
  Brain: Sparkles,
  Briefcase,
  Building,
  Settings,
};

function getIcon(iconName: string | undefined): LucideIcon {
  return iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Database;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE ORDER (canonical order for Tier 2)
// ─────────────────────────────────────────────────────────────────────────────

const MODULE_ORDER: ModuleKey[] = [
  "home",
  "core",
  "intelligence",
  "cfo",
  "govcon",
  "settings",
];

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT PANEL CONFIGURATION
// Tier 3 shows operational context, not navigation duplication
// ─────────────────────────────────────────────────────────────────────────────

interface ContextItem {
  label: string;
  value: string;
  status?: "ok" | "warning" | "error" | "pending";
  icon?: LucideIcon;
}

interface ModuleContext {
  title: string;
  mode?: string;
  scope?: string;
  items: ContextItem[];
}

function getModuleContext(module: ModuleKey | null): ModuleContext | null {
  if (!module) return null;

  switch (module) {
    case "core":
      /**
       * P1 FIX: Removed misleading static timestamps and "Live" claims.
       * "Last Refresh: 2m ago" was hardcoded, implying real-time data.
       * "Data Sync: Live" claimed live sync that doesn't exist.
       * Now shows honest, static context information only.
       */
      return {
        title: "Core Context",
        mode: "Operational",
        scope: "All Accounts",
        items: [
          {
            label: "Data Mode",
            value: "On-demand",
            icon: CheckCircle2,
          },
          { label: "Refresh", value: "Manual", icon: Clock },
        ],
      };

    case "intelligence":
      return {
        title: "Intelligence Context",
        mode: "Analysis",
        scope: "Current Period",
        items: [
          { label: "Confidence", value: "≥85%", status: "ok", icon: Shield },
          { label: "Signals", value: "Advisory", icon: AlertCircle },
        ],
      };

    case "cfo":
      return {
        title: "CFO Context",
        mode: "Executive",
        scope: "Organization",
        items: [
          { label: "View", value: "Read-only", icon: Shield },
          { label: "Period", value: "Current FY", icon: Clock },
        ],
      };

    case "govcon":
      return {
        title: "GovCon Context",
        mode: "Compliance",
        scope: "DCAA Standards",
        items: [
          { label: "Audit Mode", value: "Active", status: "ok", icon: Shield },
          {
            label: "Hash Chain",
            value: "Verified",
            status: "ok",
            icon: CheckCircle2,
          },
        ],
      };

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getActiveModule(pathname: string): ModuleKey | null {
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
  if (pathname.startsWith("/govcon")) return "govcon";
  if (pathname.startsWith("/settings")) return "settings";
  return null;
}

function getStatusColor(
  status?: "ok" | "warning" | "error" | "pending",
): string {
  switch (status) {
    case "ok":
      return "text-chart-1";
    case "warning":
      return "text-chart-4";
    case "error":
      return "text-destructive";
    case "pending":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { signOut } = useClerk();
  const { profile } = useUserProfile();

  const activeModule = getActiveModule(pathname);

  const showGovCon = useMemo(
    () => hasGovConEntitlement(profile?.tiers, profile?.role),
    [profile?.tiers, profile?.role],
  );

  // Build ordered modules list (filtered by entitlements)
  const visibleModules = useMemo(() => {
    return MODULE_ORDER.filter((key) => {
      if (key === "govcon" && !showGovCon) return false;
      return true;
    });
  }, [showGovCon]);

  // Get context for active module (Tier 3 - operational context, not nav)
  const moduleContext = useMemo(() => {
    return getModuleContext(activeModule);
  }, [activeModule]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <aside className="relative flex h-full overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────────────
          TIER 1 + TIER 2: Main Sidebar Rail
          Fixed width, contains identity + primary modules
      ───────────────────────────────────────────────────────────────────── */}
      <div className="relative w-56 shrink-0 flex flex-col h-full bg-background border-r border-border">
        <div className="flex flex-col h-full">
          {/* ─────────────────────────────────────────────────────────────────
              TIER 1: Workspace / Product Identity
          ───────────────────────────────────────────────────────────────── */}
          <div className="h-14 flex items-center px-4 border-b border-border">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors group-hover:border-primary/40">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-foreground tracking-tight">
                  ReconAI
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                  Control Plane
                </span>
              </div>
            </Link>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              TIER 2: Primary Module Rail
              No accordion, no collapsing. Active module highlighted.
          ───────────────────────────────────────────────────────────────── */}
          <nav
            className="flex-1 overflow-y-auto py-3 px-2"
            aria-label="Primary navigation"
          >
            <div className="space-y-0.5">
              {visibleModules.map((moduleKey) => {
                const moduleInfo = MODULES[moduleKey];
                const Icon = getIcon(moduleInfo.icon);
                const isActive = activeModule === moduleKey;
                const href = moduleInfo.landingRoute;

                return (
                  <Link
                    key={moduleKey}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      isActive
                        ? "bg-primary/10 text-foreground border-l-2 border-primary -ml-0.5 pl-[calc(0.75rem-2px)]"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border-l-2 border-transparent -ml-0.5 pl-[calc(0.75rem-2px)]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                        isActive
                          ? "bg-primary/15"
                          : "bg-muted/50 group-hover:bg-accent",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "h-4 w-4 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground",
                        ].join(" ")}
                      />
                    </div>
                    <span className="truncate">{moduleInfo.shortLabel}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ─────────────────────────────────────────────────────────────────
              FOOTER: Quick Actions + Sign Out
          ───────────────────────────────────────────────────────────────── */}
          <div className="border-t border-border p-3 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/"
                className="flex items-center justify-center h-8 w-8 rounded-md border border-border bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Marketing Home"
              >
                <Home className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="flex items-center justify-center h-8 w-8 rounded-md border border-border bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Help & Support"
              >
                <HelpCircle className="h-4 w-4" />
              </Link>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground bg-muted border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TIER 3: Context Panel (NOT navigation duplication)
          Shows: Mode, Scope, Operational State
          Visible only when module has meaningful context to display.
      ───────────────────────────────────────────────────────────────────── */}
      {moduleContext && (
        <div className="relative w-44 shrink-0 flex flex-col h-full border-r border-border bg-muted/50">
          {/* Context header */}
          <div className="h-14 flex flex-col justify-center px-3 border-b border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Context
            </span>
            {moduleContext.mode && (
              <span className="text-xs font-medium text-foreground">
                {moduleContext.mode} Mode
              </span>
            )}
          </div>

          {/* Context content */}
          <div className="flex-1 overflow-y-auto py-3 px-3">
            {/* Scope indicator */}
            {moduleContext.scope && (
              <div className="mb-3 pb-3 border-b border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Scope
                </div>
                <div className="text-xs font-medium text-foreground">
                  {moduleContext.scope}
                </div>
              </div>
            )}

            {/* Status items */}
            <div className="space-y-2">
              {moduleContext.items.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {ItemIcon && (
                        <ItemIcon
                          className={`h-3 w-3 shrink-0 ${getStatusColor(item.status)}`}
                        />
                      )}
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-medium shrink-0 ${getStatusColor(item.status)}`}
                    >
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Context footer - visual anchor */}
          <div className="px-3 py-2 border-t border-border">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 text-center">
              Read-only
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
