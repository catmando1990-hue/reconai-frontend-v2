"use client";

import {
  CheckCircle,
  CreditCard,
  ExternalLink,
  Landmark,
  Plus,
  RefreshCw,
} from "lucide-react";
import PolicyBanner from "@/components/recon/PolicyBanner";
import "@/styles/invoicing/InvoicingConnections.css";

const connectedAccounts = [
  {
    id: "icn-001",
    name: "Invoicing Operating Account",
    institution: "First National Bank",
    accountMask: "****6789",
    entryMethod: "Automated",
    connectedDate: "Jan 2025",
    status: "Active",
    lastSynced: "Mar 30, 2026",
    usedFor: "Payment Processing",
  },
  {
    id: "icn-002",
    name: "Payment Processing",
    institution: "Stripe",
    accountMask: null,
    entryMethod: "Connected",
    connectedDate: "Feb 2025",
    status: "Active",
    lastSynced: null,
    usedFor: "Online Payments",
  },
  {
    id: "icn-003",
    name: "Receivables Account",
    institution: "Business Credit Union",
    accountMask: "****3456",
    entryMethod: "Automated",
    connectedDate: "Mar 2025",
    status: "Active",
    lastSynced: "Mar 29, 2026",
    usedFor: "Invoice Reconciliation",
  },
];

export default function InvoicingConnections() {
  return (
    <div className="invoicing-connections">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="legal"
        context="invoicing-connections"
        message="Bank connections for the Invoicing module are maintained separately. These connections are used exclusively for payment processing and invoice reconciliation."
        dismissible
      />

      {/* Header */}
      <header className="icn-header">
        <div className="icn-header-content">
          <div className="icn-header-title">
            <Landmark size={22} />
            <h1>Connections</h1>
          </div>
          <p>Manage invoicing payment and reconciliation connections</p>
        </div>
        <button className="icn-btn primary">
          <Plus size={16} />
          Add Connection
        </button>
      </header>

      {/* Connected Accounts */}
      <div className="icn-accounts-grid">
        {connectedAccounts.map((account) => (
          <div key={account.id} className="icn-account-card">
            <div className="icn-card-top">
              <div className="icn-institution-icon">
                {account.accountMask ? (
                  <Landmark size={20} />
                ) : (
                  <CreditCard size={20} />
                )}
              </div>
              <div className="icn-card-header-info">
                <h3 className="icn-account-name">{account.name}</h3>
                <span className="icn-institution-name">
                  {account.institution}
                </span>
              </div>
              <div className="icn-status-indicator">
                <CheckCircle size={14} />
                <span>{account.status}</span>
              </div>
            </div>

            <div className="icn-card-details">
              {account.accountMask && (
                <div className="icn-detail-row">
                  <span className="icn-detail-label">Account</span>
                  <span className="icn-detail-value">
                    {account.accountMask}
                  </span>
                </div>
              )}
              <div className="icn-detail-row">
                <span className="icn-detail-label">Entry Method</span>
                <span className="icn-detail-value">{account.entryMethod}</span>
              </div>
              <div className="icn-detail-row">
                <span className="icn-detail-label">Connected</span>
                <span className="icn-detail-value">
                  {account.connectedDate}
                </span>
              </div>
              {account.lastSynced && (
                <div className="icn-detail-row">
                  <span className="icn-detail-label">Last Synced</span>
                  <span className="icn-detail-value">{account.lastSynced}</span>
                </div>
              )}
              <div className="icn-detail-row">
                <span className="icn-detail-label">Used For</span>
                <span className="icn-detail-value">
                  <span className="icn-purpose-badge">{account.usedFor}</span>
                </span>
              </div>
            </div>

            <div className="icn-card-actions">
              <button className="icn-btn sync">
                <RefreshCw size={14} />
                Sync Now
              </button>
              <button className="icn-btn outline">
                <ExternalLink size={14} />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
