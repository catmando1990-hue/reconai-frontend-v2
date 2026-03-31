"use client";

import "@/styles/invoicing/InvoicingInvoices.css";
import {
  Eye,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { useState } from "react";

const invoicesData = [
  {
    number: "INV-2026-042",
    customer: "Acme Corp",
    amount: 8500.0,
    status: "sent",
    issueDate: "Mar 20",
    dueDate: "Apr 15",
    actions: ["view", "edit"],
  },
  {
    number: "INV-2026-041",
    customer: "Global Tech Solutions",
    amount: 12350.0,
    status: "overdue",
    issueDate: "Feb 12",
    dueDate: "Mar 15",
    actions: ["view", "edit"],
  },
  {
    number: "INV-2026-040",
    customer: "Summit LLC",
    amount: 4200.0,
    status: "paid",
    issueDate: "Mar 1",
    dueDate: "Mar 28",
    actions: ["view"],
  },
  {
    number: "INV-2026-039",
    customer: "Vertex Inc",
    amount: 6800.0,
    status: "draft",
    issueDate: "Mar 28",
    dueDate: "--",
    actions: ["edit", "send"],
  },
  {
    number: "INV-2026-038",
    customer: "Atlas Group",
    amount: 15000.0,
    status: "sent",
    issueDate: "Mar 10",
    dueDate: "Apr 5",
    actions: ["view", "edit"],
  },
  {
    number: "INV-2026-037",
    customer: "RedOak Partners",
    amount: 3200.0,
    status: "paid",
    issueDate: "Feb 20",
    dueDate: "Mar 18",
    actions: ["view"],
  },
  {
    number: "INV-2026-036",
    customer: "Pinnacle Systems",
    amount: 9750.0,
    status: "sent",
    issueDate: "Mar 15",
    dueDate: "Apr 12",
    actions: ["view", "edit"],
  },
  {
    number: "INV-2026-035",
    customer: "CloudBridge Inc",
    amount: 2100.0,
    status: "paid",
    issueDate: "Feb 28",
    dueDate: "Mar 25",
    actions: ["view"],
  },
];

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

export default function InvoicingInvoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
