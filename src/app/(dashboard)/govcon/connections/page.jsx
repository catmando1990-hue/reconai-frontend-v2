"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/govcon/GovConConnections.css";
import {
  Building2,
  CheckCircle,
  ExternalLink,
  FileText,
  Info,
  Landmark,
  Plus,
  RefreshCw,
} from "lucide-react";

const connectedAccounts = [
  {
    id: "gc-001",
    name: "Government Contract Operating Account",
    institution: "First National Bank",
    accountMask: "****4521",
    entryMethod: "Manual Entry",
    connectedDate: "Mar 2024",
    status: "Active",
    costPool: "Direct Costs",
    linkedContracts: ["FA-8721", "W912DY"],
    lastReconciled: "Mar 28, 2026",
  },
  {
    id: "gc-002",
    name: "Indirect Cost Account",
    institution: "First National Bank",
    accountMask: "****4522",
    entryMethod: "Manual Entry",
    connectedDate: "Mar 2024",
    status: "Active",
    costPool: "Indirect (Overhead, G&A, Fringe)",
    linkedContracts: [],
    lastReconciled: "Mar 25, 2026",
  },
  {
    id: "gc-003",
    name: "Tax & Compliance Reserve",
    institution: "Federal Credit Union",
    accountMask: "****7890",
    entryMethod: "Manual Entry",
    connectedDate: "Jun 2024",
    status: "Active",
    costPool: "G&A",
    linkedContracts: [],
    lastReconciled: "Mar 20, 2026",
  },
];

export default function GovConConnections() {
  return (
    <div className="govcon-connections">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="legal"
        context="govcon-connections"
        message="Bank connections for GovCon are maintained separately for DCAA compliance. Manual entry is required — automated bank feeds are not used for government contract accounting."
        dismissible
      />

      {/* Header */}
      <header className="gcn-header">
        <div className="gcn-header-content">
          <div className="gcn-header-title">
            <Building2 size={22} />
            <h1>Connections</h1>
          </div>
          <p>Manage government contract banking connections</p>
        </div>
        <button className="gcn-btn primary">
          <Plus size={16} />
          Add Connection
        </button>
      </header>

      {/* DCAA Compliance Note */}
      <div className="gcn-note-card">
        <Info size={16} />
        <p>
          <strong>DCAA Compliance Note:</strong> Government contract accounting
          requires manual bank statement reconciliation. Automated feeds are
          maintained separately from commercial banking connections.
        </p>
      </div>

      {/* Connected Accounts */}
      <div className="gcn-accounts-grid">
        {connectedAccounts.map((account) => (
          <div key={account.id} className="gcn-account-card">
            <div className="gcn-card-top">
              <div className="gcn-institution-icon">
                <Landmark size={20} />
              </div>
              <div className="gcn-card-header-info">
                <h3 className="gcn-account-name">{account.name}</h3>
                <span className="gcn-institution-name">
                  {account.institution}
                </span>
              </div>
              <div className="gcn-status-indicator">
                <CheckCircle size={14} />
                <span>{account.status}</span>
              </div>
            </div>

            <div className="gcn-card-details">
              <div className="gcn-detail-row">
                <span className="gcn-detail-label">Account</span>
                <span className="gcn-detail-value">{account.accountMask}</span>
              </div>
              <div className="gcn-detail-row">
                <span className="gcn-detail-label">Entry Method</span>
                <span className="gcn-detail-value">{account.entryMethod}</span>
              </div>
              <div className="gcn-detail-row">
                <span className="gcn-detail-label">Connected</span>
                <span className="gcn-detail-value">
                  {account.connectedDate}
                </span>
              </div>
              <div className="gcn-detail-row">
                <span className="gcn-detail-label">Cost Pool</span>
                <span className="gcn-detail-value">
                  <span className="gcn-cost-pool-badge">
                    {account.costPool}
                  </span>
                </span>
              </div>
              {account.linkedContracts.length > 0 && (
                <div className="gcn-detail-row">
                  <span className="gcn-detail-label">Linked Contracts</span>
                  <span className="gcn-detail-value">
                    <div className="gcn-contract-tags">
                      {account.linkedContracts.map((contract) => (
                        <span key={contract} className="gcn-contract-tag">
                          <FileText size={10} />
                          {contract}
                        </span>
                      ))}
                    </div>
                  </span>
                </div>
              )}
              <div className="gcn-detail-row">
                <span className="gcn-detail-label">Last Reconciled</span>
                <span className="gcn-detail-value">
                  {account.lastReconciled}
                </span>
              </div>
            </div>

            <div className="gcn-card-actions">
              <button className="gcn-btn reconcile">
                <RefreshCw size={14} />
                Reconcile
              </button>
              <button className="gcn-btn outline">
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
