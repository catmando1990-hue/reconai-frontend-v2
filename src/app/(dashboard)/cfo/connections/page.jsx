"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/cfo/CFOConnections.css";
import {
  Building2,
  CheckCircle,
  CreditCard,
  Info,
  Landmark,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  Wallet,
} from "lucide-react";

// Supported institution types
const institutionTypes = [
  {
    id: "bank",
    name: "Bank Accounts",
    icon: Landmark,
    description: "Connect checking, savings, and money market accounts.",
  },
  {
    id: "credit",
    name: "Credit Cards",
    icon: CreditCard,
    description: "Track credit card transactions and balances.",
  },
  {
    id: "accounting",
    name: "Accounting Software",
    icon: Wallet,
    description: "Sync with QuickBooks, Xero, or other accounting platforms.",
  },
];

// Security features
const securityFeatures = [
  { icon: Lock, text: "Bank-level 256-bit encryption" },
  { icon: Shield, text: "Read-only access - no transactions" },
  { icon: CheckCircle, text: "SOC 2 Type II compliant" },
];

export default function CFOConnections() {
  return (
    <div className="cfo-connections">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="general"
        context="cfo-connections"
        message="CFO connections are separate from Core banking connections. Data linked here is used exclusively for CFO intelligence and reporting."
        dismissible
      />

      <div className="connections-layout">
        {/* Main Content */}
        <main className="connections-main">
          {/* Header */}
          <header className="connections-header">
            <div className="header-content">
              <h1>CFO Connections</h1>
              <p>
                Connect financial accounts for executive-level insights, cash
                flow analysis, and forecasting.
              </p>
            </div>
            <button className="connect-btn primary">
              <Plus size={16} />
              Add Connection
            </button>
          </header>

          {/* Empty State */}
          <div className="connections-empty">
            <div className="empty-icon">
              <Building2 size={40} />
            </div>
            <h2>No accounts connected</h2>
            <p>
              Connect your business accounts to unlock CFO intelligence features
              including cash flow analysis, runway calculations, and financial
              projections.
            </p>

            {/* Institution Types */}
            <div className="institution-types">
              {institutionTypes.map((type) => (
                <button key={type.id} className="institution-card">
                  <type.icon size={24} />
                  <div className="institution-info">
                    <span className="institution-name">{type.name}</span>
                    <span className="institution-desc">{type.description}</span>
                  </div>
                  <Plus size={16} className="add-icon" />
                </button>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="security-notice">
            <div className="security-header">
              <Shield size={16} />
              <h3>Security & Privacy</h3>
            </div>
            <div className="security-features">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="security-feature">
                  <feature.icon size={14} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="connections-sidebar">
          {/* Connected Accounts Panel */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <Building2 size={14} />
              <h3>Connected Accounts</h3>
            </div>
            <div className="panel-empty">
              <p>No accounts connected yet.</p>
            </div>
          </div>

          {/* About CFO Connections */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <Info size={14} />
              <h3>About CFO Connections</h3>
            </div>
            <div className="about-content">
              <p>
                <strong>Separate from Core</strong>
                <br />
                CFO connections are isolated from Core banking connections for
                security and organizational separation.
              </p>
              <p>
                <strong>Executive Insights</strong>
                <br />
                Data from these connections powers CFO-specific features:
                runway, burn rate, cash flow, and board reporting.
              </p>
              <p>
                <strong>Read-Only Access</strong>
                <br />
                We only read transaction data. No transfers, payments, or
                account modifications are possible.
              </p>
            </div>
          </div>

          {/* Data Sync Status */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <RefreshCw size={14} />
              <h3>Sync Status</h3>
            </div>
            <div className="sync-status">
              <div className="sync-row">
                <span className="sync-label">Last sync</span>
                <span className="sync-value muted">No accounts</span>
              </div>
              <div className="sync-row">
                <span className="sync-label">Next sync</span>
                <span className="sync-value muted">--</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
