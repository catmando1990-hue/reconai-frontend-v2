"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/invoicing/InvoicingPayments.css";

const mockPayments = [
  {
    id: 1,
    date: "Mar 28, 2026",
    type: "Received",
    reference: "PMT-042",
    party: "Summit LLC",
    amount: 4200.0,
    method: "ACH",
    status: "Cleared",
  },
  {
    id: 2,
    date: "Mar 25, 2026",
    type: "Sent",
    reference: "PMT-041",
    party: "Metro Supplies",
    amount: 1350.0,
    method: "Check",
    status: "Cleared",
  },
  {
    id: 3,
    date: "Mar 22, 2026",
    type: "Received",
    reference: "PMT-040",
    party: "RedOak Partners",
    amount: 3200.0,
    method: "Wire",
    status: "Cleared",
  },
  {
    id: 4,
    date: "Mar 20, 2026",
    type: "Received",
    reference: "PMT-039",
    party: "CloudBridge Inc",
    amount: 2100.0,
    method: "ACH",
    status: "Cleared",
  },
  {
    id: 5,
    date: "Mar 18, 2026",
    type: "Sent",
    reference: "PMT-038",
    party: "GreenLeaf Services",
    amount: 890.0,
    method: "ACH",
    status: "Cleared",
  },
  {
    id: 6,
    date: "Mar 15, 2026",
    type: "Sent",
    reference: "PMT-037",
    party: "CloudHost Pro",
    amount: 2850.0,
    method: "ACH",
    status: "Pending",
  },
  {
    id: 7,
    date: "Mar 12, 2026",
    type: "Received",
    reference: "PMT-036",
    party: "Pinnacle Systems",
    amount: 9750.0,
    method: "Wire",
    status: "Cleared",
  },
  {
    id: 8,
    date: "Mar 10, 2026",
    type: "Received",
    reference: "PMT-035",
    party: "Atlas Group",
    amount: 15000.0,
    method: "ACH",
    status: "Cleared",
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function InvoicingPayments() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateRange, setDateRange] = useState("This Month");

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesType = typeFilter === "All" || payment.type === typeFilter;
    return matchesType;
  });

  return (
    <div className="ip-invoicing-payments">
      <PolicyBanner
        policy="info"
        context="invoicing-payments"
        message="Payment records are maintained within the Invoicing module. Payment data is not shared across modules."
        dismissible
      />

      {/* Header */}
      <div className="ip-header">
        <div className="ip-header-left">
          <DollarSign size={24} className="ip-header-icon" />
          <h1 className="ip-title">Payments</h1>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="ip-controls">
        <div className="ip-type-tabs">
          {["All", "Received", "Sent"].map((tab) => (
            <button
              key={tab}
              className={`ip-tab-btn ${typeFilter === tab ? "ip-tab-active" : ""}`}
              onClick={() => setTypeFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="ip-date-range">
          <Calendar size={16} className="ip-calendar-icon" />
          <select
            className="ip-date-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="This Quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ip-kpi-grid">
        <div className="ip-kpi-card ip-kpi-received">
          <div className="ip-kpi-icon-wrapper ip-kpi-icon-green">
            <ArrowDownLeft size={20} />
          </div>
          <div className="ip-kpi-content">
            <div className="ip-kpi-label">Received This Month</div>
            <div className="ip-kpi-value">$68,200.00</div>
            <div className="ip-kpi-count">15 payments</div>
          </div>
        </div>
        <div className="ip-kpi-card ip-kpi-sent">
          <div className="ip-kpi-icon-wrapper ip-kpi-icon-orange">
            <ArrowUpRight size={20} />
          </div>
          <div className="ip-kpi-content">
            <div className="ip-kpi-label">Sent This Month</div>
            <div className="ip-kpi-value">$9,290.00</div>
            <div className="ip-kpi-count">4 payments</div>
          </div>
        </div>
        <div className="ip-kpi-card ip-kpi-net">
          <div className="ip-kpi-icon-wrapper ip-kpi-icon-teal">
            <TrendingUp size={20} />
          </div>
          <div className="ip-kpi-content">
            <div className="ip-kpi-label">Net Cash Flow</div>
            <div className="ip-kpi-value ip-kpi-positive">+$58,910.00</div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="ip-table-card">
        <div className="ip-table-wrapper">
          <table className="ip-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Customer / Vendor</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.date}</td>
                  <td>
                    <span
                      className={`ip-type-badge ${
                        payment.type === "Received"
                          ? "ip-type-received"
                          : "ip-type-sent"
                      }`}
                    >
                      {payment.type === "Received" ? (
                        <ArrowDownLeft size={12} />
                      ) : (
                        <ArrowUpRight size={12} />
                      )}
                      {payment.type}
                    </span>
                  </td>
                  <td className="ip-reference">{payment.reference}</td>
                  <td className="ip-party-name">{payment.party}</td>
                  <td
                    className={`ip-amount ${
                      payment.type === "Received"
                        ? "ip-amount-received"
                        : "ip-amount-sent"
                    }`}
                  >
                    {payment.type === "Received" ? "+" : "-"}
                    {formatCurrency(payment.amount)}
                  </td>
                  <td>
                    <span className="ip-method-badge">{payment.method}</span>
                  </td>
                  <td>
                    <span
                      className={`ip-status-badge ${
                        payment.status === "Cleared"
                          ? "ip-status-cleared"
                          : "ip-status-pending"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="7" className="ip-empty-state">
                    No payments match your filter criteria.
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
