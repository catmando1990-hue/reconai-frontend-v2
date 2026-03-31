"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/payroll/PayrollConnections.css";
import {
  Building2,
  CheckCircle,
  HeartPulse,
  Info,
  Landmark,
  Lock,
  Plus,
  Receipt,
  RefreshCw,
  Shield,
} from "lucide-react";

// Supported payroll institution types
const institutionTypes = [
  {
    id: "payroll-bank",
    name: "Payroll Bank Account",
    icon: Landmark,
    description:
      "Connect the bank account used for payroll disbursements and direct deposits.",
  },
  {
    id: "tax-payment",
    name: "Tax Payment Account",
    icon: Receipt,
    description:
      "Link accounts used for federal, state, and local payroll tax remittances.",
  },
  {
    id: "benefits-provider",
    name: "Benefits Provider",
    icon: HeartPulse,
    description:
      "Connect health insurance, 401(k), and other benefits provider accounts.",
  },
];

// Security features
const securityFeatures = [
  { icon: Lock, text: "Bank-level 256-bit encryption" },
  { icon: Shield, text: "Read-only access - no transactions" },
  { icon: CheckCircle, text: "SOC 2 Type II compliant" },
];

export default function PayrollConnections() {
  return (
    <div className="payroll-connections">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="general"
        context="payroll-connections"
        message="Payroll bank connections are completely separate from Core and CFO connections. Data linked here is used exclusively for payroll processing and compliance."
        dismissible
      />

      <div className="payroll-connections-layout">
        {/* Main Content */}
        <main className="payroll-connections-main">
          {/* Header */}
          <header className="payroll-connections-header">
            <div className="payroll-header-content">
              <div className="payroll-header-title">
                <Building2 size={22} />
                <h1>Payroll Connections</h1>
              </div>
              <p>Connect payroll bank accounts</p>
            </div>
            <button className="payroll-connect-btn primary">
              <Plus size={16} />
              Add Connection
            </button>
          </header>

          {/* Empty State - Institution Type Cards */}
          <div className="payroll-connections-empty">
            <div className="payroll-empty-icon">
              <Building2 size={40} />
            </div>
            <h2>No payroll accounts connected</h2>
            <p>
              Connect your payroll bank accounts to enable automated pay runs,
              tax filing reconciliation, and benefits payment tracking.
            </p>

            {/* Institution Types - 3 column grid */}
            <div className="payroll-institution-types">
              {institutionTypes.map((type) => (
                <div key={type.id} className="payroll-institution-card">
                  <div className="payroll-institution-icon">
                    <type.icon size={24} />
                  </div>
                  <div className="payroll-institution-info">
                    <span className="payroll-institution-name">
                      {type.name}
                    </span>
                    <span className="payroll-institution-desc">
                      {type.description}
                    </span>
                  </div>
                  <div className="payroll-institution-status">
                    <span className="payroll-not-connected">Not connected</span>
                  </div>
                  <button className="payroll-connect-btn outline">
                    <Plus size={14} />
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="payroll-security-notice">
            <div className="payroll-security-header">
              <Shield size={16} />
              <h3>Security & Privacy</h3>
            </div>
            <div className="payroll-security-features">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="payroll-security-feature">
                  <feature.icon size={14} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="payroll-connections-sidebar">
          {/* About Payroll Connections */}
          <div className="payroll-sidebar-panel">
            <div className="payroll-panel-header">
              <Info size={14} />
              <h3>About Payroll Connections</h3>
            </div>
            <div className="payroll-about-content">
              <p>
                <strong>Separate from Core & CFO</strong>
                <br />
                Payroll connections are fully isolated from Core banking and CFO
                connections for security and regulatory compliance.
              </p>
              <p>
                <strong>Payroll Processing</strong>
                <br />
                Data from these connections powers payroll-specific features:
                pay run reconciliation, tax remittance tracking, and benefits
                payment verification.
              </p>
              <p>
                <strong>Read-Only Access</strong>
                <br />
                We only read transaction data. No transfers, payments, or
                account modifications are possible.
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="payroll-sidebar-panel">
            <div className="payroll-panel-header">
              <RefreshCw size={14} />
              <h3>Connection Status</h3>
            </div>
            <div className="payroll-connection-status">
              <div className="payroll-status-row">
                <span className="payroll-status-label">Payroll Bank</span>
                <span className="payroll-status-value muted">
                  Not connected
                </span>
              </div>
              <div className="payroll-status-row">
                <span className="payroll-status-label">Tax Payment</span>
                <span className="payroll-status-value muted">
                  Not connected
                </span>
              </div>
              <div className="payroll-status-row">
                <span className="payroll-status-label">Benefits</span>
                <span className="payroll-status-value muted">
                  Not connected
                </span>
              </div>
              <div className="payroll-status-row">
                <span className="payroll-status-label">Last sync</span>
                <span className="payroll-status-value muted">--</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
