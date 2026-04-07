"use client";

import GovConChat from "@/components/recon/GovConChat";
import "@/styles/govcon/GovConLayout.css";
import {
  Brain,
  Building2,
  Calculator,
  ClipboardCheck,
  Clock,
  FileSearch,
  GitCompare,
  LayoutDashboard,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const govconTabs = [
  { name: "Overview", path: "/govcon", icon: LayoutDashboard, end: true },
  { name: "Contracts", path: "/govcon/contracts", icon: ScrollText },
  { name: "Timekeeping", path: "/govcon/timekeeping", icon: Clock },
  { name: "Indirect Costs", path: "/govcon/indirects", icon: Calculator },
  { name: "Reconciliation", path: "/govcon/reconciliation", icon: GitCompare },
  { name: "Audit Trail", path: "/govcon/audit", icon: FileSearch },
  { name: "SF-1408", path: "/govcon/sf-1408", icon: ClipboardCheck },
  { name: "Connections", path: "/govcon/connections", icon: Building2 },
  { name: "Intelligence", path: "/govcon/intelligence", icon: Brain },
];

export default function GovConLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="govcon-page">
      <div className="govcon-layout">
        <div className="govcon-main">
          {/* Sub-tabs Navigation */}
          <nav className="govcon-tab-nav">
            {govconTabs.map((tab) => {
              const isActive = tab.end
                ? pathname === tab.path
                : pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`govcon-tab ${isActive ? "active" : ""}`}
                >
                  <tab.icon size={16} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Tab Content */}
          <div className="govcon-tab-content">{children}</div>
        </div>

        {/* GovCon Chat Sidebar */}
        <div className="govcon-chat">
          <GovConChat />
        </div>
      </div>
    </div>
  );
}
