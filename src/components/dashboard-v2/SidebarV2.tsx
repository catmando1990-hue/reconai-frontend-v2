"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Sparkles,
  Building,
  Settings,
  LogOut,
  CheckCircle2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useUserProfile } from "@/lib/user-profile-context";
import {
  hasGovConEntitlement,
  hasPayrollEntitlement,
} from "@/lib/entitlements";
import { MODULES, type ModuleKey } from "@/lib/dashboardNav";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Home: LayoutDashboard,
  Database: FileText,
  Brain: Sparkles,
  Briefcase: BarChart3,
  Wallet: Wallet,
  Building: Building,
  Settings: Settings,
};

function getIcon(iconName: string | undefined): LucideIcon {
  return iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : FileText;
}

const MODULE_ORDER: ModuleKey[] = [
  "home",
  "core",
  "intelligence",
  "cfo",
  "payroll",
  "govcon",
  "settings",
];

function getActiveModule(pathname: string): ModuleKey | null {
  if (pathname.startsWith("/home")) return "home";
  if (
    pathname.startsWith("/core") ||
    pathname.startsWith("/connect-bank") ||
    pathname.startsWith("/upload") ||
    pathname.startsWith("/documents")
  )
    return "core";
  if (pathname.startsWith("/intelligence")) return "intelligence";
  if (pathname.startsWith("/cfo")) return "cfo";
  if (pathname.startsWith("/payroll")) return "payroll";
  if (pathname.startsWith("/govcon")) return "govcon";
  if (pathname.startsWith("/settings") || pathname.startsWith("/account"))
    return "settings";
  return null;
}

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  badge?: number;
}

function NavItem({ href, icon: Icon, label, isActive, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-[#059669]/10 text-[#059669]"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 transition-colors",
          isActive
            ? "text-[#059669]"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#059669]/20 px-1.5 text-xs font-medium text-[#059669]">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function SidebarV2() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { profile } = useUserProfile();

  const activeModule = getActiveModule(pathname);

  const showGovCon = useMemo(
    () => hasGovConEntitlement(profile?.tiers, profile?.role),
    [profile?.tiers, profile?.role],
  );

  const showPayroll = useMemo(
    () => hasPayrollEntitlement(profile?.tiers, profile?.role),
    [profile?.tiers, profile?.role],
  );

  const visibleModules = useMemo(() => {
    return MODULE_ORDER.filter((key) => {
      if (key === "govcon" && !showGovCon) return false;
      if (key === "payroll" && !showPayroll) return false;
      return true;
    });
  }, [showGovCon, showPayroll]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const intelligenceBadge = 3;

  return (
    <aside className="flex h-full w-56 flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-primary-foreground"
          >
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-lg font-semibold text-foreground">ReconAI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {visibleModules.map((moduleKey) => {
            const moduleInfo = MODULES[moduleKey];
            const Icon = getIcon(moduleInfo.icon);
            const isActive = activeModule === moduleKey;
            const href = moduleInfo.landingRoute;
            const badge =
              moduleKey === "intelligence" ? intelligenceBadge : undefined;

            return (
              <NavItem
                key={moduleKey}
                href={href}
                icon={Icon}
                label={moduleInfo.shortLabel}
                isActive={isActive}
                badge={badge}
              />
            );
          })}
        </div>
      </nav>

      {/* Audit Trail Status */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-lg bg-[#059669]/10 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-[#059669]" />
          <span className="text-sm font-medium text-[#059669]">
            Audit Trail Enabled
          </span>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName || "User"}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {user?.firstName?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.fullName || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
