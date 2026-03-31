"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/govcon/GovConIntelligence.css";
import { Brain, Clock, Eye, RefreshCw, Shield, Tag, Zap } from "lucide-react";
import { useState } from "react";

const SIGNALS = [
  {
    id: "sig-001",
    title: "DCAA Readiness Gap Detected",
    severity: "high",
    confidence: 0.91,
    category: "DCAA Compliance",
    description:
      "Supervisor timesheet approval workflow has not been documented for 2 active contracts. DCAA floor check requirements may not be met during next audit cycle.",
    detectedAt: "2026-03-29T14:22:00Z",
  },
  {
    id: "sig-002",
    title: "Indirect Rate Drift",
    severity: "medium",
    confidence: 0.84,
    category: "Cost Accounting",
    description:
      "Q1 actual overhead rate (46.1%) is trending 2.0% above the provisional rate (45.2%). Consider requesting a rate adjustment to avoid significant year-end variance.",
    detectedAt: "2026-03-28T09:15:00Z",
  },
  {
    id: "sig-003",
    title: "Unallowable Cost Flagged",
    severity: "high",
    confidence: 0.95,
    category: "FAR Compliance",
    description:
      "3 transactions totaling $2,840 have been preliminarily flagged as potentially unallowable under FAR 31.205. Manual review and reclassification recommended before ICS submission.",
    detectedAt: "2026-03-30T08:00:00Z",
  },
  {
    id: "sig-004",
    title: "Contract Period Expiring",
    severity: "medium",
    confidence: 0.88,
    category: "Contract Management",
    description:
      "Contract N00024-23-C-1234 period of performance ends May 31, 2026. Final invoice and closeout documentation should be initiated within 60 days.",
    detectedAt: "2026-03-27T16:40:00Z",
  },
];

function SeverityBadge({ severity }) {
  return (
    <span className={`gi-severity-badge ${severity}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const percentage = Math.round(confidence * 100);
  const level =
    confidence >= 0.8 ? "high" : confidence >= 0.6 ? "medium" : "low";
  return (
    <span className={`gi-confidence-badge ${level}`}>
      {percentage}% confidence
    </span>
  );
}

function CategoryTag({ category }) {
  return (
    <span className="gi-category-tag">
      <Tag size={11} />
      {category}
    </span>
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

function SignalCard({ signal }) {
  const timeAgo = formatTimeAgo(signal.detectedAt);

  return (
    <div className={`gi-signal-card ${signal.severity}`}>
      <div className="gi-signal-header">
        <div className="gi-signal-badges">
          <SeverityBadge severity={signal.severity} />
          <ConfidenceBadge confidence={signal.confidence} />
        </div>
        <span className="gi-signal-time">
          <Clock size={11} />
          {timeAgo}
        </span>
      </div>
      <h3 className="gi-signal-title">{signal.title}</h3>
      <p className="gi-signal-description">{signal.description}</p>
      <div className="gi-signal-footer">
        <CategoryTag category={signal.category} />
        <button className="gi-details-btn">
          <Eye size={12} />
          Details
        </button>
      </div>
    </div>
  );
}

export default function GovConIntelligence() {
  const [signals, setSignals] = useState(SIGNALS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSignals([...SIGNALS]);
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="govcon-intelligence">
      {/* Advisory Banner */}
      <PolicyBanner
        policy="legal"
        context="govcon-intelligence"
        message="GovCon Intelligence provides AI-generated advisory insights for DCAA readiness and contract compliance. These signals do not constitute audit opinions or compliance certifications."
        dismissible
      />

      {/* Header */}
      <header className="gi-header">
        <div className="gi-header-left">
          <div className="gi-header-title">
            <Brain size={22} />
            <h1>GovCon Intelligence</h1>
          </div>
          <p className="gi-header-subtitle">
            AI-powered DCAA readiness and compliance signals
          </p>
        </div>
        <div className="gi-header-right">
          <button
            className="gi-refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* Signals Summary */}
      <div className="gi-signals-summary">
        <div className="gi-summary-left">
          <Zap size={14} />
          <span>
            {signals.length} signal{signals.length !== 1 ? "s" : ""} detected
          </span>
        </div>
        <div className="gi-summary-right">
          <span className="gi-summary-count high">
            {signals.filter((s) => s.severity === "high").length} High
          </span>
          <span className="gi-summary-count medium">
            {signals.filter((s) => s.severity === "medium").length} Medium
          </span>
          <span className="gi-summary-count low">
            {signals.filter((s) => s.severity === "low").length} Low
          </span>
        </div>
      </div>

      {/* Signal Cards */}
      <div className="gi-signals-grid">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {/* Disclaimer Footer */}
      <div className="gi-disclaimer-footer">
        <Shield size={14} />
        <div>
          <strong>AI-Generated Government Contracting Intelligence</strong>
          <p>
            These signals are generated from timekeeping, cost accounting, and
            contract data. They are intended to support compliance review and do
            not replace professional audit guidance.
          </p>
        </div>
      </div>
    </div>
  );
}
