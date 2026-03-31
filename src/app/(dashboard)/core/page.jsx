"use client";

import "@/styles/core/Overview.css";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle,
  Copy,
  Eye,
  Info,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

// Simulated backend data
const telemetryData = {
  auditEvents: 1247,
  transactions: 3842,
  duplicates: 3,
  lastPlaidSync: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
  // Net worth data
  totalAssets: 279410.75,
  totalLiabilities: 18215.5,
};

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

function PolicyBanner({ onDismiss }) {
  return (
    <div className="policy-banner">
      <div className="policy-icon">
        <Info size={20} />
      </div>
      <div className="policy-content">
        <strong>ReconAI is a bookkeeping support surface</strong>
        <p>
          Records must be verified. Users should consult a qualified
          professional for official reporting.
        </p>
      </div>
      <button
        className="policy-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function TelemetryTile({
  icon: Icon,
  title,
  value,
  subtitle,
  chip,
  chipType,
  readOnly,
}) {
  return (
    <div className="telemetry-tile">
      <div className="tile-header">
        <div className="tile-icon">
          <Icon size={22} />
        </div>
        {readOnly && (
          <span className="readonly-badge">
            <Eye size={12} />
            Read-only
          </span>
        )}
      </div>
      <div className="tile-body">
        <span className="tile-value">{value.toLocaleString()}</span>
        <span className="tile-title">{title}</span>
        {subtitle && <span className="tile-subtitle">{subtitle}</span>}
      </div>
      {chip && (
        <div className={`tile-chip ${chipType}`}>
          {chipType === "warning" && <AlertTriangle size={14} />}
          {chipType === "success" && <CheckCircle size={14} />}
          <span>{chip}</span>
        </div>
      )}
    </div>
  );
}

function SyncTile({ lastSync }) {
  const relativeTime = getRelativeTime(lastSync);

  return (
    <div className="telemetry-tile sync-tile">
      <div className="tile-header">
        <div className="tile-icon sync">
          <RefreshCw size={22} />
        </div>
      </div>
      <div className="tile-body">
        <span className="tile-value">{relativeTime}</span>
        <span className="tile-title">Plaid Sync</span>
        <span className="tile-subtitle">Last synchronization</span>
      </div>
      <div className="tile-chip success">
        <CheckCircle size={14} />
        <span>Connected</span>
      </div>
    </div>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function NetWorthTile({ assets, liabilities }) {
  const netWorth = assets - liabilities;
  const isPositive = netWorth >= 0;

  return (
    <div className="net-worth-tile">
      <div className="net-worth-header">
        <div className="net-worth-icon">
          <Wallet size={28} />
        </div>
        <div className="net-worth-title-section">
          <h3>Net Worth</h3>
          <span className="net-worth-subtitle">
            Total assets minus liabilities
          </span>
        </div>
      </div>
      <div className="net-worth-value-section">
        <span
          className={`net-worth-value ${isPositive ? "positive" : "negative"}`}
        >
          {formatCurrency(netWorth)}
        </span>
      </div>
      <div className="net-worth-breakdown">
        <div className="breakdown-item assets">
          <div className="breakdown-icon">
            <TrendingUp size={16} />
          </div>
          <div className="breakdown-info">
            <span className="breakdown-label">Total Assets</span>
            <span className="breakdown-value">{formatCurrency(assets)}</span>
          </div>
        </div>
        <div className="breakdown-divider"></div>
        <div className="breakdown-item liabilities">
          <div className="breakdown-icon">
            <TrendingDown size={16} />
          </div>
          <div className="breakdown-info">
            <span className="breakdown-label">Total Liabilities</span>
            <span className="breakdown-value">
              {formatCurrency(liabilities)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Overview() {
  // Initialize banner state from sessionStorage (lazy initializer avoids effect)
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("policyBannerDismissed");
    }
    return true;
  });
  const [data] = useState(telemetryData);

  const handleDismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem("policyBannerDismissed", "true");
  };

  return (
    <div className="core-overview">
      {/* Policy Banner */}
      {showBanner && <PolicyBanner onDismiss={handleDismissBanner} />}

      {/* Page Header */}
      <div className="overview-header">
        <div>
          <h1>Core Overview</h1>
          <p>Operational posture snapshot</p>
        </div>
      </div>

      {/* Net Worth Tile */}
      <NetWorthTile
        assets={data.totalAssets}
        liabilities={data.totalLiabilities}
      />

      {/* Telemetry Tiles */}
      <div className="telemetry-grid">
        <TelemetryTile
          icon={Shield}
          title="Audit Events"
          value={data.auditEvents}
          subtitle="Total recorded events"
          readOnly
        />

        <TelemetryTile
          icon={ArrowLeftRight}
          title="Transactions"
          value={data.transactions}
          subtitle="Normalized transaction count"
        />

        <TelemetryTile
          icon={Copy}
          title="Duplicates"
          value={data.duplicates}
          subtitle="Potential duplicate entries"
          chip={data.duplicates > 0 ? "Investigate" : "Clear"}
          chipType={data.duplicates > 0 ? "warning" : "success"}
        />

        <SyncTile lastSync={data.lastPlaidSync} />
      </div>
    </div>
  );
}
