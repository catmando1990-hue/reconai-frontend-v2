"use client";

import {
  ChevronDown,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { billsApi } from "@/api";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/invoicing/InvoicingBills.css";

const statusClasses = {
  Pending: "ib-status-pending",
  Paid: "ib-status-paid",
  Overdue: "ib-status-overdue",
  Scheduled: "ib-status-scheduled",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoicingBills() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await billsApi.listBills();
      const list = Array.isArray(raw) ? raw : [];
      setBills(
        list.map((b) => ({
          id: b.id,
          billNumber: b.bill_number || b.number || `BILL-${b.id}`,
          vendor: b.vendor_name || b.vendor || "Unknown",
          amount: b.total || b.amount || 0,
          status: b.status
            ? b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase()
            : "Pending",
          received: formatDate(b.received_date || b.created_at),
          dueDate: formatDate(b.due_date),
        })),
      );
    } catch (err) {
      console.warn("[InvoicingBills] Failed to fetch bills:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="ib-invoicing-bills">
      <PolicyBanner
        policy="info"
        context="invoicing-bills"
        message="Bills and accounts payable are tracked within the Invoicing module. This data is not shared with other modules."
        dismissible
      />

      {/* Summary Cards */}
      <div className="ib-summary-grid">
        {(() => {
          const pending = bills.filter((b) => b.status === "Pending");
          const overdue = bills.filter((b) => b.status === "Overdue");
          const paid = bills.filter((b) => b.status === "Paid");
          const scheduled = bills.filter((b) => b.status === "Scheduled");
          return (
            <>
              <div className="ib-summary-card ib-summary-pending">
                <div className="ib-summary-label">Total Pending</div>
                <div className="ib-summary-value">
                  {formatCurrency(pending.reduce((s, b) => s + b.amount, 0))}
                </div>
                <div className="ib-summary-count">
                  {pending.length} bill{pending.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="ib-summary-card ib-summary-overdue">
                <div className="ib-summary-label">Overdue</div>
                <div className="ib-summary-value">
                  {formatCurrency(overdue.reduce((s, b) => s + b.amount, 0))}
                </div>
                <div className="ib-summary-count">
                  {overdue.length} bill{overdue.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="ib-summary-card ib-summary-paid">
                <div className="ib-summary-label">Paid This Month</div>
                <div className="ib-summary-value">
                  {formatCurrency(paid.reduce((s, b) => s + b.amount, 0))}
                </div>
                <div className="ib-summary-count">
                  {paid.length} bill{paid.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="ib-summary-card ib-summary-scheduled">
                <div className="ib-summary-label">Scheduled</div>
                <div className="ib-summary-value">
                  {formatCurrency(scheduled.reduce((s, b) => s + b.amount, 0))}
                </div>
                <div className="ib-summary-count">
                  {scheduled.length} bill{scheduled.length !== 1 ? "s" : ""}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Header */}
      <div className="ib-header">
        <div className="ib-header-left">
          <FileText size={24} className="ib-header-icon" />
          <h1 className="ib-title">Bills</h1>
        </div>
        <button className="ib-record-bill-btn">
          <Plus size={16} />
          Record Bill
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="ib-search-bar">
        <div className="ib-search-input-wrapper">
          <Search size={16} className="ib-search-icon" />
          <input
            type="text"
            className="ib-search-input"
            placeholder="Search bills by number or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ib-filter-group">
          <Filter size={16} className="ib-filter-icon" />
          <select
            className="ib-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Scheduled">Scheduled</option>
          </select>
          <ChevronDown size={14} className="ib-select-chevron" />
        </div>
      </div>

      {/* Bills Table */}
      <div className="ib-table-card">
        <div className="ib-table-wrapper">
          <table className="ib-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Received</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id}>
                  <td className="ib-bill-number">{bill.billNumber}</td>
                  <td className="ib-vendor-name">{bill.vendor}</td>
                  <td className="ib-amount">{formatCurrency(bill.amount)}</td>
                  <td>
                    <span
                      className={`ib-status-badge ${statusClasses[bill.status]}`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td>{bill.received}</td>
                  <td>{bill.dueDate}</td>
                  <td className="ib-actions">
                    {(bill.status === "Pending" ||
                      bill.status === "Overdue") && (
                      <button className="ib-pay-btn">
                        <CreditCard size={14} />
                        Pay
                      </button>
                    )}
                    <button className="ib-view-btn">
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan="7" className="ib-empty-state">
                    No bills match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
