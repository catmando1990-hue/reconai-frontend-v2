"use client";

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
import { useCallback, useEffect, useState } from "react";
import { billsApi, invoicingApi } from "@/api";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/invoicing/InvoicingOverview.css";

const quickLinks = [
  { label: "New Invoice", icon: Plus },
  { label: "View All Invoices", icon: List },
  { label: "Manage Customers", icon: Users },
  { label: "Payment History", icon: History },
];

function formatCurrency(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InvoicingOverview() {
  const [kpiData, setKpiData] = useState([
    {
      label: "Outstanding Invoices",
      amount: "--",
      detail: "--",
      icon: FileText,
    },
    { label: "Overdue", amount: "--", detail: "--", icon: AlertTriangle },
    { label: "Paid This Month", amount: "--", detail: "--", icon: CheckCircle },
    { label: "Bills Due", amount: "--", detail: "--", icon: Clock },
  ]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [agingData, setAgingData] = useState([
    { range: "0-30 days", amount: "$0", value: 0 },
    { range: "31-60 days", amount: "$0", value: 0 },
    { range: "61-90 days", amount: "$0", value: 0 },
    { range: "90+ days", amount: "$0", value: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invoicesRaw, billsRaw, agingRaw] = await Promise.all([
        invoicingApi.listInvoices(),
        billsApi.listBills(),
        invoicingApi.getArAging().catch(() => null),
      ]);

      const invoices = Array.isArray(invoicesRaw) ? invoicesRaw : [];
      const bills = Array.isArray(billsRaw) ? billsRaw : [];

      // Normalize invoices
      const normalizedInvoices = invoices.map((inv) => ({
        id: inv.id,
        number: inv.invoice_number || inv.number || `INV-${inv.id}`,
        customer: inv.customer_name || inv.customer || "Unknown",
        amount: inv.total || inv.amount || 0,
        status: (inv.status || "draft").toLowerCase(),
        issueDate: inv.issue_date || inv.created_at,
        dueDate: inv.due_date,
      }));

      // Compute KPI data
      const outstanding = normalizedInvoices.filter(
        (i) => i.status === "sent" || i.status === "overdue",
      );
      const overdue = normalizedInvoices.filter((i) => i.status === "overdue");
      const paid = normalizedInvoices.filter((i) => i.status === "paid");
      const pendingBills = bills.filter(
        (b) =>
          (b.status || "").toLowerCase() === "pending" ||
          (b.status || "").toLowerCase() === "overdue",
      );

      setKpiData([
        {
          label: "Outstanding Invoices",
          amount: formatCurrency(outstanding.reduce((s, i) => s + i.amount, 0)),
          detail: `${outstanding.length} invoice${outstanding.length !== 1 ? "s" : ""}`,
          icon: FileText,
        },
        {
          label: "Overdue",
          amount: formatCurrency(overdue.reduce((s, i) => s + i.amount, 0)),
          detail: `${overdue.length} invoice${overdue.length !== 1 ? "s" : ""}`,
          icon: AlertTriangle,
        },
        {
          label: "Paid This Month",
          amount: formatCurrency(paid.reduce((s, i) => s + i.amount, 0)),
          detail: `${paid.length} invoice${paid.length !== 1 ? "s" : ""}`,
          icon: CheckCircle,
        },
        {
          label: "Bills Due",
          amount: formatCurrency(
            pendingBills.reduce((s, b) => s + (b.total || b.amount || 0), 0),
          ),
          detail: `${pendingBills.length} bill${pendingBills.length !== 1 ? "s" : ""}`,
          icon: Clock,
        },
      ]);

      // Recent invoices (latest 5)
      const sorted = [...normalizedInvoices].sort(
        (a, b) => new Date(b.issueDate || 0) - new Date(a.issueDate || 0),
      );
      setRecentInvoices(
        sorted.slice(0, 5).map((inv) => ({
          number: inv.number,
          customer: inv.customer,
          amount: formatCurrency(inv.amount),
          status: inv.status,
          due:
            inv.status === "paid"
              ? `Paid ${formatDate(inv.dueDate)}`
              : inv.dueDate
                ? `Due ${formatDate(inv.dueDate)}`
                : "--",
        })),
      );

      // AR Aging
      if (agingRaw) {
        const buckets = Array.isArray(agingRaw)
          ? agingRaw
          : agingRaw.buckets || [];
        if (buckets.length > 0) {
          setAgingData(
            buckets.map((b) => ({
              range: b.range || b.label || "",
              amount: formatCurrency(b.amount || b.value || 0),
              value: b.amount || b.value || 0,
            })),
          );
        }
      }
    } catch (err) {
      console.warn("[InvoicingOverview] Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
