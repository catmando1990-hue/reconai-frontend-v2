"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  ChevronRight,
  Download,
  FileText,
  Scale,
  Bot,
} from 'lucide-react';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/cfo/CFOExecutiveSummary.css';

// Lifecycle states
const LIFECYCLE = {
  IDLE: 'idle',
  LOADING: 'loading',
  PENDING: 'pending',
  STALE: 'stale',
  FAILED: 'failed',
  READY: 'ready',
  REFRESHING: 'refreshing',
};

// Mock API response
const mockApiResponse = {
  cfo_version: '2.1.0',
  snapshot: {
    status: 'on-track',
    period: 'Q1 2026',
    generatedAt: new Date().toISOString(),
    boardDate: '2026-04-15',
  },
  metrics: {
    runway: {
      value: 18.5,
      unit: 'months',
      sentiment: 'positive',
      trend: 'up',
      previous: 16.2,
      isAvailable: true,
    },
    cashOnHand: {
      value: 2400000,
      unit: 'currency',
      sentiment: 'positive',
      trend: 'up',
      previous: 2150000,
      isAvailable: true,
    },
    monthlyBurn: {
      value: 129700,
      unit: 'currency',
      sentiment: 'neutral',
      trend: 'down',
      previous: 132800,
      isAvailable: true,
    },
  },
  risks: [
    { id: 1, title: 'AR aging exceeds 45 days', severity: 'medium', impact: 'Cash flow timing' },
    { id: 2, title: 'Q2 pipeline below forecast', severity: 'high', impact: 'Revenue at risk' },
  ],
  nextActions: [
    { id: 1, title: 'Review Q1 board materials', dueDate: '2026-04-10', owner: 'CFO' },
    { id: 2, title: 'Finalize investor update', dueDate: '2026-04-12', owner: 'Finance' },
    { id: 3, title: 'Submit tax filing', dueDate: '2026-04-15', owner: 'Tax' },
  ],
};

// Null state copy for metrics
const NULL_STATE_COPY = {
  runway: 'Insufficient data to calculate',
  cashOnHand: 'Awaiting bank data',
  monthlyBurn: 'Requires 30+ days of data',
};

function formatCurrency(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function formatMetricValue(value, unit) {
  switch (unit) {
    case 'currency': return formatCurrency(value);
    case 'months': return `${value.toFixed(1)} months`;
    case 'percentage': return `${value.toFixed(1)}%`;
    default: return value;
  }
}

function calculateChange(current, previous) {
  return ((current - previous) / previous) * 100;
}

function LifecycleStatusBanner({ lifecycle, onRetry, message }) {
  const config = {
    [LIFECYCLE.PENDING]: {
      icon: Loader2,
      title: 'Computing',
      className: 'pending',
      spinning: true,
    },
    [LIFECYCLE.STALE]: {
      icon: Clock,
      title: 'Data may be outdated',
      className: 'stale',
      showRefresh: true,
    },
    [LIFECYCLE.FAILED]: {
      icon: XCircle,
      title: 'Unable to load',
      className: 'failed',
      showRetry: true,
    },
  };

  const currentConfig = config[lifecycle];
  if (!currentConfig) return null;

  const Icon = currentConfig.icon;

  return (
    <div className={`lifecycle-banner ${currentConfig.className}`}>
      <Icon size={18} className={currentConfig.spinning ? 'spinning' : ''} />
      <div className="lifecycle-content">
        <span className="lifecycle-title">{currentConfig.title}</span>
        <span className="lifecycle-message">{message}</span>
      </div>
      {currentConfig.showRefresh && (
        <button className="lifecycle-action" onClick={onRetry}>
          <RefreshCw size={14} /> Refresh
        </button>
      )}
      {currentConfig.showRetry && (
        <button className="lifecycle-action" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

function ExecutiveMetricCard({ metricKey, metric, nullCopy }) {
  const labels = {
    runway: 'Runway',
    cashOnHand: 'Cash on Hand',
    monthlyBurn: 'Monthly Burn',
  };

  const icons = {
    runway: Calendar,
    cashOnHand: DollarSign,
    monthlyBurn: TrendingDown,
  };

  const Icon = icons[metricKey];
  const label = labels[metricKey];

  if (!metric.isAvailable) {
    return (
      <div className="executive-metric unavailable">
        <div className="metric-header">
          <Icon size={16} />
          <span className="metric-label">{label}</span>
        </div>
        <div className="metric-unavailable">
          <Info size={14} />
          <span>{nullCopy}</span>
        </div>
      </div>
    );
  }

  const change = calculateChange(metric.value, metric.previous);
  const isPositive = change >= 0;
  const sentimentClass = metric.sentiment === 'positive' ? 'emerald' :
                         metric.sentiment === 'negative' ? 'destructive' : 'neutral';

  return (
    <div className={`executive-metric ${sentimentClass}`}>
      <div className="metric-header">
        <Icon size={16} />
        <span className="metric-label">{label}</span>
        <span className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
      <div className="metric-value">{formatMetricValue(metric.value, metric.unit)}</div>
      <div className="metric-previous">
        vs. {formatMetricValue(metric.previous, metric.unit)} prior
      </div>
    </div>
  );
}

function RiskCard({ risk }) {
  const severityConfig = {
    high: { className: 'high', icon: AlertCircle },
    medium: { className: 'medium', icon: AlertTriangle },
    low: { className: 'low', icon: Info },
  };

  const config = severityConfig[risk.severity];
  const Icon = config.icon;

  return (
    <div className={`risk-card ${config.className}`}>
      <Icon size={14} />
      <div className="risk-content">
        <span className="risk-title">{risk.title}</span>
        <span className="risk-impact">{risk.impact}</span>
      </div>
    </div>
  );
}

function ActionRow({ action }) {
  const dueDate = new Date(action.dueDate);
  const isOverdue = dueDate < new Date();
  const formattedDate = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className={`action-row ${isOverdue ? 'overdue' : ''}`}>
      <CheckCircle2 size={12} />
      <span className="action-title">{action.title}</span>
      <span className="action-owner">{action.owner}</span>
      <span className={`action-due ${isOverdue ? 'overdue' : ''}`}>{formattedDate}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    'on-track': { label: 'On Track', className: 'success' },
    'at-risk': { label: 'At Risk', className: 'warning' },
    'off-track': { label: 'Off Track', className: 'danger' },
  };
  const { label, className } = config[status] || config['on-track'];
  return <span className={`exec-status-badge ${className}`}>{label}</span>;
}

export default function CFOExecutiveSummary() {
  const [lifecycle, setLifecycle] = useState(LIFECYCLE.LOADING);
  const [data, setData] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLifecycle(LIFECYCLE.LOADING);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate different lifecycle states for demo (normally would come from API)
      // For now, default to READY
      setData(mockApiResponse);
      setLifecycle(LIFECYCLE.READY);
    } catch {
      setLifecycle(LIFECYCLE.FAILED);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRetry = () => {
    fetchSummary();
  };

  // Loading state
  if (lifecycle === LIFECYCLE.LOADING) {
    return (
      <div className="exec-summary-loading">
        <Loader2 size={36} className="spinning" />
        <p>Loading executive summary...</p>
      </div>
    );
  }

  // Pending state - computing
  if (lifecycle === LIFECYCLE.PENDING) {
    return (
      <div className="exec-summary">
        <PolicyBanner
          policy="legal"
          context="exec-summary"
          message="This summary is AI-generated. Review all figures before board presentation."
          dismissible
        />
        <div className="exec-summary-content">
          <LifecycleStatusBanner
            lifecycle={LIFECYCLE.PENDING}
            message="CFO snapshot is computing. This may take a few moments."
          />
        </div>
      </div>
    );
  }

  // Stale state
  if (lifecycle === LIFECYCLE.STALE) {
    return (
      <div className="exec-summary">
        <PolicyBanner
          policy="legal"
          context="exec-summary"
          message="This summary is AI-generated. Review all figures before board presentation."
          dismissible
        />
        <div className="exec-summary-content">
          <LifecycleStatusBanner
            lifecycle={LIFECYCLE.STALE}
            message="Executive summary data is older than 24 hours."
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  // Failed state
  if (lifecycle === LIFECYCLE.FAILED) {
    return (
      <div className="exec-summary">
        <PolicyBanner
          policy="legal"
          context="exec-summary"
          message="This summary is AI-generated. Review all figures before board presentation."
          dismissible
        />
        <div className="exec-summary-content">
          <LifecycleStatusBanner
            lifecycle={LIFECYCLE.FAILED}
            message="Executive summary is currently unavailable."
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  // Ready state - full content
  const { snapshot, metrics, risks, nextActions } = data;

  return (
    <div className="exec-summary" data-lifecycle={lifecycle}>
      {/* AI Disclaimer */}
      <PolicyBanner
        policy="legal"
        icon={Bot}
        context="exec-summary-ai"
        message="This summary is AI-generated. Review all figures before board presentation."
        dismissible
      />

      {/* Regulatory Disclaimer */}
      <PolicyBanner
        policy="accounting"
        icon={Scale}
        context="exec-summary-regulatory"
        message="Financial data is for internal use only. Consult your accountant for audited statements."
        dismissible
      />

      {/* Header */}
      <header className="exec-header">
        <div className="exec-header-left">
          <div className="exec-title-row">
            <h1>Executive Summary</h1>
            <StatusBadge status={snapshot.status} />
          </div>
          <p className="exec-subtitle">
            Board-ready decision summary for {snapshot.period}
          </p>
        </div>
        <div className="exec-header-right">
          <span className="board-date-tag">
            <Briefcase size={12} />
            Board: {new Date(snapshot.boardDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <button className="exec-btn">
            <Download size={14} />
            Export
          </button>
        </div>
      </header>

      {/* Financial Posture Panel */}
      <section className="financial-posture">
        <div className="posture-header">
          <h2>Financial Posture</h2>
          <span className="generated-at">
            <Clock size={11} />
            Generated {new Date(snapshot.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="posture-metrics">
          <ExecutiveMetricCard
            metricKey="runway"
            metric={metrics.runway}
            nullCopy={NULL_STATE_COPY.runway}
          />
          <ExecutiveMetricCard
            metricKey="cashOnHand"
            metric={metrics.cashOnHand}
            nullCopy={NULL_STATE_COPY.cashOnHand}
          />
          <ExecutiveMetricCard
            metricKey="monthlyBurn"
            metric={metrics.monthlyBurn}
            nullCopy={NULL_STATE_COPY.monthlyBurn}
          />
        </div>
      </section>

      {/* Two-column layout for Risks and Actions */}
      <div className="exec-grid">
        {/* Top Risks */}
        <section className="risks-panel">
          <div className="panel-header">
            <AlertTriangle size={14} />
            <h3>Top Risks</h3>
          </div>
          <div className="risks-list">
            {risks.map(risk => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        </section>

        {/* Next Actions */}
        <section className="actions-panel">
          <div className="panel-header">
            <Target size={14} />
            <h3>Next Actions</h3>
          </div>
          <div className="actions-list">
            {nextActions.map(action => (
              <ActionRow key={action.id} action={action} />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="exec-footer">
        <span className="version-tag">CFO v{data.cfo_version}</span>
        <a href="/cfo" className="back-link">
          <ChevronRight size={12} />
          View full CFO Overview
        </a>
      </footer>
    </div>
  );
}
