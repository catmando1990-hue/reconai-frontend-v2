"use client";

import { useState } from 'react';
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Shield,
  Eye,
  X,
  TrendingDown,
  TrendingUp,
  Wallet,
  FileWarning,
  Activity,
  Zap,
  PlayCircle,
} from 'lucide-react';
import PolicyBanner from '@/components/recon/PolicyBanner';
import { useCFOIntelligence, SIGNAL_CATEGORIES, SEVERITY, DEFAULT_CONFIDENCE_THRESHOLD } from '@/hooks/useCFOIntelligence';
import '@/styles/cfo/CFOIntelligence.css';

// Category display config
const CATEGORY_CONFIG = {
  [SIGNAL_CATEGORIES.RUNWAY_RISK]: { label: 'Runway Risk', icon: TrendingDown },
  [SIGNAL_CATEGORIES.BURN_ANOMALY]: { label: 'Burn Anomaly', icon: Activity },
  [SIGNAL_CATEGORIES.FORECAST_DEVIATION]: { label: 'Forecast Deviation', icon: TrendingUp },
  [SIGNAL_CATEGORIES.CASH_FLOW_VOLATILITY]: { label: 'Cash Flow Volatility', icon: Wallet },
  [SIGNAL_CATEGORIES.RECEIVABLES_RISK]: { label: 'Receivables Risk', icon: FileWarning },
  [SIGNAL_CATEGORIES.PAYABLES_RISK]: { label: 'Payables Risk', icon: FileWarning },
};

// Severity display config
const SEVERITY_CONFIG = {
  [SEVERITY.CRITICAL]: { label: 'Critical', className: 'critical' },
  [SEVERITY.HIGH]: { label: 'High', className: 'high' },
  [SEVERITY.MEDIUM]: { label: 'Medium', className: 'medium' },
  [SEVERITY.LOW]: { label: 'Low', className: 'low' },
  [SEVERITY.INFO]: { label: 'Info', className: 'info' },
};

function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG[SEVERITY.INFO];
  return (
    <span className={`severity-badge ${config.className}`}>
      {config.label}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const percentage = Math.round(confidence * 100);
  const level = confidence >= 0.85 ? 'high' : confidence >= 0.7 ? 'medium' : 'low';
  return (
    <span className={`confidence-badge ${level}`}>
      {percentage}% confidence
    </span>
  );
}

function CategoryBadge({ category }) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className="category-badge">
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="signals-loading">
      {[1, 2, 3].map(i => (
        <div key={i} className="signal-card-skeleton">
          <div className="skeleton-header">
            <div className="skeleton-badge" />
            <div className="skeleton-badge" />
          </div>
          <div className="skeleton-title" />
          <div className="skeleton-text" />
          <div className="skeleton-text short" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="signals-error">
      <div className="error-card">
        <AlertCircle size={24} />
        <h3>Unable to load signals</h3>
        <p>{error?.message || 'An error occurred while fetching CFO Intelligence signals.'}</p>
        <button className="retry-btn" onClick={onRetry}>
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    </div>
  );
}

function EmptyState({ isLowConfidenceMode, onRunIntelligence }) {
  return (
    <div className="signals-empty">
      <div className="empty-icon">
        <CheckCircle size={32} />
      </div>
      <h3>No signals detected</h3>
      <p>
        {isLowConfidenceMode
          ? 'No intelligence signals are available at this time. Your financial posture appears healthy.'
          : `No high-confidence signals detected. Toggle "Show low confidence" to see additional signals below ${Math.round(DEFAULT_CONFIDENCE_THRESHOLD * 100)}% confidence.`
        }
      </p>
      <button className="run-btn" onClick={onRunIntelligence}>
        <PlayCircle size={16} />
        Run Intelligence
      </button>
    </div>
  );
}

function SignalCard({ signal, onViewEvidence }) {
  const timeAgo = formatTimeAgo(signal.created_at);

  return (
    <div className={`signal-card ${SEVERITY_CONFIG[signal.severity]?.className || ''}`}>
      <div className="signal-header">
        <div className="signal-badges">
          <SeverityBadge severity={signal.severity} />
          <ConfidenceBadge confidence={signal.confidence} />
        </div>
        <span className="signal-time">
          <Clock size={11} />
          {timeAgo}
        </span>
      </div>
      <h3 className="signal-title">{signal.title}</h3>
      <p className="signal-description">{signal.description}</p>
      <div className="signal-footer">
        <CategoryBadge category={signal.category} />
        <button className="evidence-btn" onClick={() => onViewEvidence(signal)}>
          <Eye size={12} />
          Evidence
        </button>
      </div>
    </div>
  );
}

function EvidenceRenderer({ evidence, depth = 0 }) {
  if (evidence === null || evidence === undefined) {
    return <span className="evidence-null">—</span>;
  }

  // Primitive values
  if (typeof evidence !== 'object') {
    return <span className="evidence-value">{String(evidence)}</span>;
  }

  // Arrays
  if (Array.isArray(evidence)) {
    // Array of objects
    if (evidence.length > 0 && typeof evidence[0] === 'object' && evidence[0] !== null) {
      return (
        <div className="evidence-array-objects">
          {evidence.map((item, index) => (
            <div key={index} className="evidence-array-item">
              <EvidenceRenderer evidence={item} depth={depth + 1} />
            </div>
          ))}
        </div>
      );
    }
    // Array of primitives
    return (
      <ul className="evidence-list">
        {evidence.map((item, index) => (
          <li key={index}><EvidenceRenderer evidence={item} depth={depth + 1} /></li>
        ))}
      </ul>
    );
  }

  // Objects
  return (
    <div className={`evidence-object ${depth > 0 ? 'nested' : ''}`}>
      {Object.entries(evidence).map(([key, value]) => (
        <div key={key} className="evidence-row">
          <span className="evidence-key">{formatKey(key)}</span>
          <span className="evidence-value-wrapper">
            <EvidenceRenderer evidence={value} depth={depth + 1} />
          </span>
        </div>
      ))}
    </div>
  );
}

function EvidenceModal({ signal, onClose }) {
  if (!signal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="evidence-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Signal Evidence</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-content">
          {/* Signal info */}
          <div className="modal-signal-info">
            <div className="modal-badges">
              <SeverityBadge severity={signal.severity} />
              <ConfidenceBadge confidence={signal.confidence} />
            </div>
            <h3>{signal.title}</h3>
            <p>{signal.description}</p>
          </div>

          {/* Advisory disclaimer if present */}
          {signal.advisory_disclaimer && (
            <div className="modal-advisory-disclaimer">
              <AlertTriangle size={14} />
              <span>{signal.advisory_disclaimer}</span>
            </div>
          )}

          {/* Evidence */}
          <div className="modal-evidence">
            <h4>Evidence</h4>
            <div className="evidence-container">
              <EvidenceRenderer evidence={signal.evidence} />
            </div>
          </div>

          {/* Global modal disclaimer */}
          <div className="modal-global-disclaimer">
            <Shield size={14} />
            <div>
              <strong>AI-Generated Executive Oversight Signal</strong>
              <p>
                This signal relates to runway, forecast deviation, and cash flow analysis.
                These insights are inputs for finance-team review before strategic decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export default function CFOIntelligence() {
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);

  const {
    signals,
    signalCount,
    totalSignalCount,
    isLoading,
    error,
    lifecycle,
    lastUpdated,
    refetch,
  } = useCFOIntelligence({
    includeLowConfidence: showLowConfidence,
    autoRefresh: true,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleViewEvidence = (signal) => {
    setSelectedSignal(signal);
  };

  const handleCloseModal = () => {
    setSelectedSignal(null);
  };

  const lowConfidenceCount = totalSignalCount - signals.filter(s => s.confidence >= DEFAULT_CONFIDENCE_THRESHOLD).length;

  return (
    <div className="cfo-intelligence">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="legal"
        context="cfo-intelligence"
        message="CFO Intelligence provides advisory analysis only. AI-generated insights support executive judgment but do not replace professional financial advice."
        dismissible
      />

      {/* Header */}
      <header className="intelligence-header">
        <div className="header-left">
          <div className="header-title">
            <Brain size={22} />
            <h1>CFO Intelligence</h1>
          </div>
          <p className="header-subtitle">AI-powered executive finance signals</p>
        </div>
        <div className="header-right">
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </header>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="control-left">
          <label className="confidence-toggle">
            <input
              type="checkbox"
              checked={showLowConfidence}
              onChange={(e) => setShowLowConfidence(e.target.checked)}
            />
            <span className="toggle-switch" />
            <span className="toggle-label">Show low confidence signals</span>
          </label>
          {showLowConfidence && (
            <span className="low-confidence-warning">
              <AlertTriangle size={12} />
              Showing {lowConfidenceCount} signal{lowConfidenceCount !== 1 ? 's' : ''} below {Math.round(DEFAULT_CONFIDENCE_THRESHOLD * 100)}% confidence
            </span>
          )}
        </div>
        <div className="control-right">
          {lastUpdated && (
            <span className="last-updated">
              <Clock size={12} />
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="intelligence-content">
        {isLoading ? (
          <LoadingPlaceholder />
        ) : error || lifecycle === 'failed' ? (
          <ErrorState error={error} onRetry={handleRefresh} />
        ) : signalCount === 0 ? (
          <EmptyState
            isLowConfidenceMode={showLowConfidence}
            onRunIntelligence={handleRefresh}
          />
        ) : (
          <div className="signals-list">
            <div className="signals-header">
              <Zap size={14} />
              <span>{signalCount} signal{signalCount !== 1 ? 's' : ''} detected</span>
            </div>
            <div className="signals-grid">
              {signals.map(signal => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  onViewEvidence={handleViewEvidence}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evidence Modal */}
      {selectedSignal && (
        <EvidenceModal signal={selectedSignal} onClose={handleCloseModal} />
      )}
    </div>
  );
}
