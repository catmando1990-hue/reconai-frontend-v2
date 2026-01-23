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
  type LucideIcon,
} from "lucide-react";
import { useUserProfile } from "@/lib/user-profile-context";
import { hasGovConEntitlement } from "@/lib/entitlements";
import { MODULES, type ModuleKey } from "@/lib/dashboardNav";

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

const MODULE_ORDER: ModuleKey[] = [
  "home",
  "core",
  "intelligence",
  "cfo",
  "govcon",
  "settings",
];

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

  const visibleModules = useMemo(() => {
    return MODULE_ORDER.filter((key) => {
      if (key === "govcon" && !showGovCon) return false;
      return true;
    });
  }, [showGovCon]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <aside className="relative flex h-full overflow-hidden">
      <div className="relative w-56 shrink-0 flex flex-col h-full bg-background border-r border-border">
        <div className="flex flex-col h-full">
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
    </aside>
  );
}
