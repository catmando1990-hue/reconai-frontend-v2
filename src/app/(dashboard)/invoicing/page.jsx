"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/invoicing/InvoicingOverview.css";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  History,
  List,
  Plus,
  Users,
} from "lucide-react";

const kpiData = [
  {
    label: "Outstanding Invoices",
    amount: "$42,850",
    detail: "8 invoices",
    icon: FileText,
  },
  {
    label: "Overdue",
    amount: "$12,400",
    detail: "3 invoices",
    icon: AlertTriangle,
  },
  {
    label: "Paid This Month",
    amount: "$68,200",
    detail: "15 invoices",
    icon: CheckCircle,
  },
  {
    label: "Bills Due",
    amount: "$18,750",
    detail: "5 bills",
    icon: Clock,
  },
];

const recentInvoices = [
  {
    number: "INV-2026-042",
    customer: "Acme Corp",
    amount: "$8,500",
    status: "sent",
    due: "Due Apr 15",
  },
  {
    number: "INV-2026-041",
    customer: "Global Tech",
    amount: "$12,350",
    status: "overdue",
    due: "Due Mar 15",
  },
  {
    number: "INV-2026-040",
    customer: "Summit LLC",
    amount: "$4,200",
    status: "paid",
    due: "Paid Mar 28",
  },
  {
    number: "INV-2026-039",
    customer: "Vertex Inc",
    amount: "$6,800",
    status: "draft",
    due: "--",
  },
  {
    number: "INV-2026-038",
    customer: "Atlas Group",
    amount: "$15,000",
    status: "sent",
    due: "Due Apr 5",
  },
];

const agingData = [
  { range: "0-30 days", amount: "$22,300", value: 22300 },
  { range: "31-60 days", amount: "$8,150", value: 8150 },
  { range: "61-90 days", amount: "$12,400", value: 12400 },
  { range: "90+ days", amount: "$0", value: 0 },
];

const quickLinks = [
  { label: "New Invoice", icon: Plus },
  { label: "View All Invoices", icon: List },
  { label: "Manage Customers", icon: Users },
  { label: "Payment History", icon: History },
];

export default function InvoicingOverview() {
  const maxAging = Math.max(...agingData.map((d) => d.value), 1);

  return (
    <div className="inv-overview">
      <PolicyBanner
        policy="info"
        context="invoicing-overview"
        message="Invoicing provides tools for managing invoices, bills, and payment tracking. All data is isolated from other modules."
        dismissible
      />

      <div className="inv-layout">
        <div className="inv-main">
          <div className="inv-kpi-grid">
            {kpiData.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div className="inv-kpi-card" key={kpi.label}>
                  <div className="inv-kpi-icon">
                    <Icon size={22} />
                  </div>
                  <div className="inv-kpi-info">
                    <span className="inv-kpi-label">{kpi.label}</span>
                    <span className="inv-kpi-amount">{kpi.amount}</span>
                    <span className="inv-kpi-detail">{kpi.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="inv-recent-section">
            <h3 className="inv-section-title">Recent Invoices</h3>
            <div className="inv-table-wrapper">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.number}>
                      <td className="inv-invoice-number">{inv.number}</td>
                      <td>{inv.customer}</td>
                      <td className="inv-amount">{inv.amount}</td>
                      <td>
                        <span
                          className={`inv-status-badge inv-status-${inv.status}`}
                        >
                          {inv.status.charAt(0).toUpperCase() +
                            inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="inv-due-date">{inv.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="inv-sidebar">
          <div className="inv-sidebar-card">
            <h4 className="inv-sidebar-title">Quick Links</h4>
            <div className="inv-quick-links">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button className="inv-quick-link" key={link.label}>
                    <Icon size={16} />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="inv-sidebar-card">
            <h4 className="inv-sidebar-title">Accounts Receivable Aging</h4>
            <div className="inv-aging-list">
              {agingData.map((item) => (
                <div className="inv-aging-item" key={item.range}>
                  <div className="inv-aging-header">
                    <span className="inv-aging-range">{item.range}</span>
                    <span className="inv-aging-amount">{item.amount}</span>
                  </div>
                  <div className="inv-aging-bar-bg">
                    <div
                      className="inv-aging-bar-fill"
                      style={{ width: `${(item.value / maxAging) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
