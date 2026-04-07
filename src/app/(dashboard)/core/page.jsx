"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ArrowLeftRight,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Eye,
  Wallet,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { reportsApi, intelligenceApi } from '@/api';
import '@/styles/core/Overview.css';

const defaultTelemetry = {
  auditEvents: 0,
  transactions: 0,
  duplicates: 0,
  lastPlaidSync: null,
  totalAssets: 0,
  totalLiabilities: 0,
};

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
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
        <p>Records must be verified. Users should consult a qualified professional for official reporting.</p>
      </div>
      <button className="policy-dismiss" onClick={onDismiss} aria-label="Dismiss">
        <X size={18} />
      </button>
    </div>
  );
}

function TelemetryTile({ icon: Icon, title, value, subtitle, chip, chipType, readOnly }) {
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
          {chipType === 'warning' && <AlertTriangle size={14} />}
          {chipType === 'success' && <CheckCircle size={14} />}
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
          <span className="net-worth-subtitle">Total assets minus liabilities</span>
        </div>
      </div>
      <div className="net-worth-value-section">
        <span className={`net-worth-value ${isPositive ? 'positive' : 'negative'}`}>
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
            <span className="breakdown-value">{formatCurrency(liabilities)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Overview() {
  const [showBanner, setShowBanner] = useState(true);
  const [data, setData] = useState(defaultTelemetry);
  const [loading, setLoading] = useState(true);

  // Fetch overview data from backend
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const summary = await reportsApi.getDashboardSummary();
      setData({
        auditEvents: summary.audit_events ?? summary.auditEvents ?? 0,
        transactions: summary.transaction_count ?? summary.transactions ?? 0,
        duplicates: summary.duplicate_count ?? summary.duplicates ?? 0,
        lastPlaidSync: summary.last_plaid_sync ? new Date(summary.last_plaid_sync) : null,
        totalAssets: summary.total_assets ?? summary.totalAssets ?? 0,
        totalLiabilities: summary.total_liabilities ?? summary.totalLiabilities ?? 0,
      });
    } catch (err) {
      console.warn('[Overview] Failed to fetch dashboard summary:', err.message);
      // Keep defaults — page still renders
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if banner was dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('policyBannerDismissed');
    if (dismissed) {
      setShowBanner(false);
    }
    fetchOverview();
  }, [fetchOverview]);

  const handleDismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem('policyBannerDismissed', 'true');
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
      <NetWorthTile assets={data.totalAssets} liabilities={data.totalLiabilities} />

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
          chip={data.duplicates > 0 ? 'Investigate' : 'Clear'}
          chipType={data.duplicates > 0 ? 'warning' : 'success'}
        />

        <SyncTile lastSync={data.lastPlaidSync} />
      </div>
    </div>
  );
}
