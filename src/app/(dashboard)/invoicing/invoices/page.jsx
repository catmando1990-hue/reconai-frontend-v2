"use client";

import {
  Eye,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { invoicingApi } from "@/api";
import "@/styles/invoicing/InvoicingInvoices.css";

const statusOptions = ["All", "Draft", "Sent", "Paid", "Overdue"];

function formatCurrency(val) {
  return val.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

const actionIcons = {
  view: { icon: Eye, label: "View" },
  edit: { icon: Pencil, label: "Edit" },
  send: { icon: Send, label: "Send" },
};

function deriveActions(status) {
  switch (status) {
    case "draft":
      return ["edit", "send"];
    case "paid":
      return ["view"];
    default:
      return ["view", "edit"];
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InvoicingInvoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [invoicesData, setInvoicesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await invoicingApi.listInvoices();
      const list = Array.isArray(raw) ? raw : [];
      setInvoicesData(
        list.map((inv) => {
          const status = (inv.status || "draft").toLowerCase();
          return {
            number: inv.invoice_number || inv.number || `INV-${inv.id}`,
            customer: inv.customer_name || inv.customer || "Unknown",
            amount: inv.total || inv.amount || 0,
            status,
            issueDate: formatDate(inv.issue_date || inv.created_at),
            dueDate: inv.due_date ? formatDate(inv.due_date) : "--",
            actions: deriveActions(status),
          };
        }),
      );
    } catch (err) {
      console.warn("[InvoicingInvoices] Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered = invoicesData.filter((inv) => {
    const matchesSearch =
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      inv.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="ii-page">
      <div className="ii-header">
        <div className="ii-title-row">
          <FileText size={22} className="ii-title-icon" />
          <h2 className="ii-title">Invoices</h2>
        </div>
        <div className="ii-controls">
          <div className="ii-search-wrapper">
            <Search size={16} className="ii-search-icon" />
            <input
              type="text"
              className="ii-search-input"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ii-filter-wrapper">
            <Filter size={14} className="ii-filter-icon" />
            <select
              className="ii-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <button className="ii-new-btn">
            <Plus size={16} />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      <div className="ii-table-wrapper">
        <table className="ii-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="ii-empty">
                  No invoices match your search criteria.
                </td>
              </tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.number}>
                <td className="ii-inv-number">{inv.number}</td>
                <td className="ii-customer">{inv.customer}</td>
                <td className="ii-amount">{formatCurrency(inv.amount)}</td>
                <td>
                  <span className={`ii-status-badge ii-status-${inv.status}`}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </td>
                <td className="ii-date">{inv.issueDate}</td>
                <td className="ii-date">{inv.dueDate}</td>
                <td className="ii-actions">
                  {inv.actions.map((action) => {
                    const ActionIcon = actionIcons[action].icon;
                    return (
                      <button
                        key={action}
                        className="ii-action-btn"
                        title={actionIcons[action].label}
                      >
                        <ActionIcon size={14} />
                        <span className="ii-action-label">
                          {actionIcons[action].label}
                        </span>
                      </button>
                    );
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
