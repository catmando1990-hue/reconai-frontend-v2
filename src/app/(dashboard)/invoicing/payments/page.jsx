"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { invoicingApi } from "@/api";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/invoicing/InvoicingPayments.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateStr(dateStr) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoicingPayments() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateRange, setDateRange] = useState("This Month");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await invoicingApi.listPayments();
      const list = Array.isArray(raw) ? raw : [];
      setPayments(
        list.map((p) => ({
          id: p.id,
          date: formatDateStr(p.date || p.payment_date || p.created_at),
          type: p.type
            ? p.type.charAt(0).toUpperCase() + p.type.slice(1).toLowerCase()
            : "Received",
          reference: p.reference || p.payment_number || `PMT-${p.id}`,
          party:
            p.party_name ||
            p.customer_name ||
            p.vendor_name ||
            p.party ||
            "Unknown",
          amount: p.amount || 0,
          method: p.method || p.payment_method || "ACH",
          status: p.status
            ? p.status.charAt(0).toUpperCase() + p.status.slice(1).toLowerCase()
            : "Cleared",
        })),
      );
    } catch (err) {
      console.warn("[InvoicingPayments] Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = payments.filter((payment) => {
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
      {(() => {
        const received = payments.filter((p) => p.type === "Received");
        const sent = payments.filter((p) => p.type === "Sent");
        const receivedTotal = received.reduce((s, p) => s + p.amount, 0);
        const sentTotal = sent.reduce((s, p) => s + p.amount, 0);
        const net = receivedTotal - sentTotal;
        return (
          <div className="ip-kpi-grid">
            <div className="ip-kpi-card ip-kpi-received">
              <div className="ip-kpi-icon-wrapper ip-kpi-icon-green">
                <ArrowDownLeft size={20} />
              </div>
              <div className="ip-kpi-content">
                <div className="ip-kpi-label">Received This Month</div>
                <div className="ip-kpi-value">
                  {formatCurrency(receivedTotal)}
                </div>
                <div className="ip-kpi-count">
                  {received.length} payment{received.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="ip-kpi-card ip-kpi-sent">
              <div className="ip-kpi-icon-wrapper ip-kpi-icon-orange">
                <ArrowUpRight size={20} />
              </div>
              <div className="ip-kpi-content">
                <div className="ip-kpi-label">Sent This Month</div>
                <div className="ip-kpi-value">{formatCurrency(sentTotal)}</div>
                <div className="ip-kpi-count">
                  {sent.length} payment{sent.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="ip-kpi-card ip-kpi-net">
              <div className="ip-kpi-icon-wrapper ip-kpi-icon-teal">
                <TrendingUp size={20} />
              </div>
              <div className="ip-kpi-content">
                <div className="ip-kpi-label">Net Cash Flow</div>
                <div
                  className={`ip-kpi-value ${net >= 0 ? "ip-kpi-positive" : ""}`}
                >
                  {net >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(net))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
