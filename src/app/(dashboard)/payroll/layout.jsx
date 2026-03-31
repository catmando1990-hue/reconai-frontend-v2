"use client";

import PayrollChat from "@/components/PayrollChat";
import "@/styles/payroll/PayrollLayout.css";
import {
  Brain,
  Building2,
  Clock,
  CreditCard,
  DollarSign,
  Heart,
  LayoutDashboard,
  Receipt,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const payrollTabs = [
  { name: "Overview", path: "/payroll", icon: LayoutDashboard, end: true },
  { name: "People", path: "/payroll/people", icon: Users },
  { name: "Compensation", path: "/payroll/compensation", icon: DollarSign },
  { name: "Time & Labor", path: "/payroll/time-labor", icon: Clock },
  { name: "Pay Runs", path: "/payroll/pay-runs", icon: CreditCard },
  { name: "Taxes", path: "/payroll/taxes", icon: Receipt },
  { name: "Benefits", path: "/payroll/benefits", icon: Heart },
  { name: "Compliance", path: "/payroll/compliance", icon: Shield },
  { name: "Connections", path: "/payroll/connections", icon: Building2 },
  { name: "Intelligence", path: "/payroll/intelligence", icon: Brain },
];

export default function PayrollLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="payroll-page">
      <div className="payroll-layout">
        <div className="payroll-main">
          {/* Sub-tabs Navigation */}
          <nav className="payroll-tab-nav">
            {payrollTabs.map((tab) => {
              const isActive = tab.end
                ? pathname === tab.path
                : pathname.startsWith(tab.path);
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`payroll-tab ${isActive ? "active" : ""}`}
                >
                  <tab.icon size={16} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Tab Content */}
          <div className="payroll-tab-content">{children}</div>
        </div>

        {/* Payroll Chat Sidebar */}
        <div className="payroll-chat">
          <PayrollChat />
        </div>
      </div>
    </div>
  );
}
