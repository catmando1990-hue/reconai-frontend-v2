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
import { useState } from "react";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/invoicing/InvoicingBills.css";

const mockBills = [
  {
    id: 1,
    billNumber: "BILL-2026-018",
    vendor: "Office Solutions Co",
    amount: 4200.0,
    status: "Pending",
    received: "Mar 20, 2026",
    dueDate: "Apr 10, 2026",
  },
  {
    id: 2,
    billNumber: "BILL-2026-017",
    vendor: "CloudHost Pro",
    amount: 2850.0,
    status: "Pending",
    received: "Mar 15, 2026",
    dueDate: "Apr 1, 2026",
  },
  {
    id: 3,
    billNumber: "BILL-2026-016",
    vendor: "SecureIT Solutions",
    amount: 11700.0,
    status: "Overdue",
    received: "Feb 10, 2026",
    dueDate: "Mar 10, 2026",
  },
  {
    id: 4,
    billNumber: "BILL-2026-015",
    vendor: "Metro Supplies",
    amount: 1350.0,
    status: "Paid",
    received: "Mar 1, 2026",
    dueDate: "Mar 25, 2026",
  },
  {
    id: 5,
    billNumber: "BILL-2026-014",
    vendor: "GreenLeaf Services",
    amount: 890.0,
    status: "Paid",
    received: "Feb 20, 2026",
    dueDate: "Mar 15, 2026",
  },
  {
    id: 6,
    billNumber: "BILL-2026-013",
    vendor: "CloudHost Pro",
    amount: 2850.0,
    status: "Paid",
    received: "Feb 15, 2026",
    dueDate: "Mar 1, 2026",
  },
  {
    id: 7,
    billNumber: "BILL-2026-012",
    vendor: "Office Solutions Co",
    amount: 3100.0,
    status: "Scheduled",
    received: "Mar 25, 2026",
    dueDate: "Apr 5, 2026",
  },
];

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

export default function InvoicingBills() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredBills = mockBills.filter((bill) => {
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
        <div className="ib-summary-card ib-summary-pending">
          <div className="ib-summary-label">Total Pending</div>
          <div className="ib-summary-value">$7,050.00</div>
          <div className="ib-summary-count">2 bills</div>
        </div>
        <div className="ib-summary-card ib-summary-overdue">
          <div className="ib-summary-label">Overdue</div>
          <div className="ib-summary-value">$11,700.00</div>
          <div className="ib-summary-count">1 bill</div>
        </div>
        <div className="ib-summary-card ib-summary-paid">
          <div className="ib-summary-label">Paid This Month</div>
          <div className="ib-summary-value">$5,090.00</div>
          <div className="ib-summary-count">3 bills</div>
        </div>
        <div className="ib-summary-card ib-summary-scheduled">
          <div className="ib-summary-label">Scheduled</div>
          <div className="ib-summary-value">$3,100.00</div>
          <div className="ib-summary-count">1 bill</div>
        </div>
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
