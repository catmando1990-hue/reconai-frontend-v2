"use client";

import InvoicingChat from "@/components/recon/InvoicingChat";
import "@/styles/invoicing/InvoicingLayout.css";
import {
  Brain,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const invoicingTabs = [
  { name: "Overview", path: "/invoicing", icon: LayoutDashboard, end: true },
  { name: "Invoices", path: "/invoicing/invoices", icon: FileText },
  { name: "Customers", path: "/invoicing/customers", icon: Users },
  { name: "Vendors", path: "/invoicing/vendors", icon: Building2 },
  { name: "Bills", path: "/invoicing/bills", icon: Receipt },
  { name: "Payments", path: "/invoicing/payments", icon: CreditCard },
  { name: "Connections", path: "/invoicing/connections", icon: Wallet },
  { name: "Intelligence", path: "/invoicing/intelligence", icon: Brain },
];

export default function InvoicingLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="invoicing-page">
      <div className="invoicing-layout">
        <div className="invoicing-main">
          <nav className="invoicing-tab-nav">
            {invoicingTabs.map((tab) => {
              const isActive = tab.end
                ? pathname === tab.path
                : pathname === tab.path || pathname.startsWith(tab.path + "/");
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`invoicing-tab ${isActive ? "active" : ""}`}
                >
                  <tab.icon size={16} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="invoicing-tab-content">{children}</div>
        </div>

        <div className="invoicing-chat">
          <InvoicingChat />
        </div>
      </div>
    </div>
  );
}
