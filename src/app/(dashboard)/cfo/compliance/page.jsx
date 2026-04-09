"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Download,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Lock,
  User,
  Calendar,
  Archive,
  FileArchive,
  RefreshCw,
  ExternalLink,
  XCircle,
  Loader2,
} from "lucide-react";
import "@/styles/cfo/CFOCompliance.css";

// Generate request ID for error tracking
function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

// Mock data fetchers
async function fetchRBAC() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    retention_read: "granted",
    export_request: "granted",
  };
}

async function fetchRetentionPolicy() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    retention_days: 90,
    configured: true,
  };
}

async function fetchAuditLog() {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    entries: [
      {
        id: 1,
        action: "export_requested",
        user: "admin@company.com",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        details: "Q1 2026 Export Pack",
      },
      {
        id: 2,
        action: "retention_updated",
        user: "cfo@company.com",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        details: "Changed from 60 to 90 days",
      },
      {
        id: 3,
        action: "rbac_modified",
        user: "admin@company.com",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        details: "Granted export access to finance team",
      },
      {
        id: 4,
        action: "export_completed",
        user: "system",
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        details: "Pack ID: exp_abc123",
      },
    ],
    total: 4,
  };
}

// Status Chip component
function StatusChip({ status, children }) {
  const config = {
    success: { icon: CheckCircle, className: "success" },
    error: { icon: XCircle, className: "error" },
    warning: { icon: AlertTriangle, className: "warning" },
    pending: { icon: Clock, className: "pending" },
    info: { icon: Info, className: "info" },
  };
  const { icon: Icon, className } = config[status] || config.info;

  return (
    <span className={`status-chip ${className}`}>
      <Icon size={12} />
      {children}
    </span>
  );
}

// Audit Panel
function AuditPanel({ entries, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="panel-loading">
        <Loader2 size={20} className="spinning" />
        <span>Loading audit log...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-error">
        <AlertCircle size={16} />
        <span>Failed to load audit log</span>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="panel-empty">
        <FileText size={20} />
        <span>No audit entries available</span>
        <p>Audit logging will begin when compliance actions are performed.</p>
      </div>
    );
  }

  return (
    <div className="audit-list">
      {entries.map((entry) => (
        <div key={entry.id} className="audit-entry">
          <div className="audit-icon">
            <FileText size={14} />
          </div>
          <div className="audit-content">
            <div className="audit-header">
              <span className="audit-action">{formatAction(entry.action)}</span>
              <span className="audit-time">
                {formatTimeAgo(entry.timestamp)}
              </span>
            </div>
            <p className="audit-details">{entry.details}</p>
            <span className="audit-user">
              <User size={10} />
              {entry.user}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Retention Panel
function RetentionPanel({ rbac, policy, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="panel-loading">
        <Loader2 size={20} className="spinning" />
        <span>Loading retention policy...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-error">
        <AlertCircle size={16} />
        <span>Failed to load retention policy</span>
      </div>
    );
  }

  const canRead = rbac?.retention_read === "granted";

  if (!canRead) {
    return (
      <div className="panel-restricted">
        <Lock size={20} />
        <span>Access restricted</span>
        <p>You do not have permission to view retention settings.</p>
      </div>
    );
  }

  return (
    <div className="retention-info">
      <div className="retention-row">
        <span className="retention-label">Retention Period</span>
        <span className="retention-value">
          {policy?.configured
            ? `${policy.retention_days} days`
            : "Not configured"}
        </span>
      </div>
      <div className="retention-row">
        <span className="retention-label">Evidence Storage</span>
        <span className="retention-value">Encrypted at rest</span>
      </div>
      <div className="retention-row">
        <span className="retention-label">Auto-Purge</span>
        <span className="retention-value">
          {policy?.configured ? "Enabled" : "Disabled"}
        </span>
      </div>
      <p className="retention-note">
        Evidence older than the retention period is automatically purged in
        compliance with data retention policies.
      </p>
    </div>
  );
}

// Export Pack Request Panel
function ExportPackRequestPanel({ rbac, onRequest, submitting }) {
  const [period, setPeriod] = useState("Q1 2026");
  const canRequest = rbac?.export_request === "granted";

  if (!canRequest) {
    return (
      <div className="panel-restricted">
        <Lock size={20} />
        <span>Access restricted</span>
        <p>You do not have permission to request export packs.</p>
      </div>
    );
  }

  return (
    <div className="export-pack-form">
      <div className="form-row">
        <label>Export Period</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="Q1 2026">Q1 2026</option>
          <option value="Q4 2025">Q4 2025</option>
          <option value="Q3 2025">Q3 2025</option>
          <option value="FY 2025">FY 2025</option>
        </select>
      </div>
      <div className="form-row">
        <label>Include</label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" defaultChecked /> Financial statements
          </label>
          <label className="checkbox-label">
            <input type="checkbox" defaultChecked /> Audit trail
          </label>
          <label className="checkbox-label">
            <input type="checkbox" defaultChecked /> Evidence attachments
          </label>
        </div>
      </div>
      <button
        className="request-btn"
        onClick={() => onRequest(period)}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 size={14} className="spinning" />
            Requesting...
          </>
        ) : (
          <>
            <FileArchive size={14} />
            Request Export Pack
          </>
        )}
      </button>
      <p className="export-note">
        Export packs are generated asynchronously. You will be notified when
        ready.
      </p>
    </div>
  );
}

function formatAction(action) {
  const labels = {
    export_requested: "Export Requested",
    export_completed: "Export Completed",
    retention_updated: "Retention Updated",
    rbac_modified: "Access Modified",
  };
  return labels[action] || action;
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

export default function CFOCompliance() {
  const [rbac, setRbac] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [auditLog, setAuditLog] = useState(null);
  const [loading, setLoading] = useState({
    rbac: true,
    policy: true,
    audit: true,
  });
  const [errors, setErrors] = useState({
    rbac: null,
    policy: null,
    audit: null,
  });
  const [exportSubmitting, setExportSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch data on mount (waits for auth readiness in real impl)
  useEffect(() => {
    const loadData = async () => {
      // Fetch RBAC
      try {
        const rbacData = await fetchRBAC();
        setRbac(rbacData);
        setLoading((prev) => ({ ...prev, rbac: false }));
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          rbac: { message: err.message, request_id: generateRequestId() },
        }));
        setLoading((prev) => ({ ...prev, rbac: false }));
      }

      // Fetch Retention Policy
      try {
        const policyData = await fetchRetentionPolicy();
        setPolicy(policyData);
        setLoading((prev) => ({ ...prev, policy: false }));
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          policy: { message: err.message, request_id: generateRequestId() },
        }));
        setLoading((prev) => ({ ...prev, policy: false }));
      }

      // Fetch Audit Log
      try {
        const auditData = await fetchAuditLog();
        setAuditLog(auditData);
        setLoading((prev) => ({ ...prev, audit: false }));
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          audit: { message: err.message, request_id: generateRequestId() },
        }));
        setLoading((prev) => ({ ...prev, audit: false }));
      }
    };

    loadData();
  }, []);

  const handleExportPackRequest = async (period) => {
    setExportSubmitting(true);
    setNotification(null);

    try {
      // Mock POST /api/export-pack
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const requestId = generateRequestId();

      setNotification({
        status: "success",
        message: `Export pack requested for ${period}`,
        request_id: requestId,
      });
    } catch (err) {
      setNotification({
        status: "error",
        message: "Failed to request export pack",
        request_id: generateRequestId(),
      });
    } finally {
      setExportSubmitting(false);
    }
  };

  const handleExportAll = async () => {
    setNotification(null);

    try {
      // Mock POST /api/cfo/export
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate CSV download
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `compliance_export_${timestamp}.csv`;

      // Create mock CSV content
      const csvContent =
        "date,action,user,details\n" +
          auditLog?.entries
            .map((e) => `${e.timestamp},${e.action},${e.user},"${e.details}"`)
            .join("\n") || "";

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setNotification({
        status: "success",
        message: `Downloaded ${filename}`,
      });
    } catch (err) {
      setNotification({
        status: "error",
        message: "Failed to export compliance data",
        request_id: generateRequestId(),
      });
    }
  };

  const hasErrors = errors.rbac || errors.policy;

  return (
    <div className="cfo-compliance">
      {/* Notification Banner */}
      {notification && (
        <div className={`notification-banner ${notification.status}`}>
          <StatusChip status={notification.status}>
            {notification.message}
          </StatusChip>
          {notification.request_id && (
            <span className="notification-request-id">
              Request ID: {notification.request_id}
            </span>
          )}
          <button
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="compliance-header">
        <div className="header-left">
          <div className="header-title">
            <Shield size={22} />
            <h1>CFO Compliance</h1>
          </div>
          <p className="header-subtitle">
            Audit, retention, and export governance
          </p>
        </div>
        <div className="header-right">
          <button className="export-all-btn" onClick={handleExportAll}>
            <Download size={16} />
            Export All
          </button>
        </div>
      </header>

      <div className="compliance-layout">
        {/* Main Content */}
        <main className="compliance-main">
          {/* Audit Log Panel */}
          <section className="compliance-panel">
            <div className="panel-header">
              <FileText size={16} />
              <h2>Audit Log</h2>
            </div>
            <AuditPanel
              entries={auditLog?.entries}
              isLoading={loading.audit}
              error={errors.audit}
            />
          </section>

          {/* Evidence Retention Panel */}
          <section className="compliance-panel">
            <div className="panel-header">
              <Archive size={16} />
              <h2>Evidence Retention</h2>
            </div>
            <RetentionPanel
              rbac={rbac}
              policy={policy}
              isLoading={loading.policy}
              error={errors.policy}
            />
          </section>

          {/* Export Pack Panel */}
          <section className="compliance-panel">
            <div className="panel-header">
              <FileArchive size={16} />
              <h2>Export Pack</h2>
            </div>
            <ExportPackRequestPanel
              rbac={rbac}
              onRequest={handleExportPackRequest}
              submitting={exportSubmitting}
            />
          </section>
        </main>

        {/* Sidebar */}
        <aside className="compliance-sidebar">
          {/* Advisory Label */}
          <div className="sidebar-advisory">
            <Info size={14} />
            <span>Informational only. Requires verification.</span>
          </div>

          {/* Error Summary */}
          {hasErrors && (
            <div className="sidebar-panel error-panel">
              <div className="panel-header">
                <AlertTriangle size={14} />
                <h3>Errors</h3>
              </div>
              <div className="error-list">
                {errors.rbac && (
                  <div className="error-item">
                    <span>RBAC fetch failed</span>
                    <code>{errors.rbac.request_id}</code>
                  </div>
                )}
                {errors.policy && (
                  <div className="error-item">
                    <span>Retention fetch failed</span>
                    <code>{errors.policy.request_id}</code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compliance Status */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <CheckCircle size={14} />
              <h3>Compliance Status</h3>
            </div>
            <div className="status-list">
              <div className="status-row">
                <span className="status-label">Audit Entries</span>
                <span className="status-value">
                  {loading.audit
                    ? "Loading..."
                    : errors.audit
                      ? "Error"
                      : auditLog?.total > 0
                        ? `${auditLog.total} entries`
                        : "Requires setup"}
                </span>
              </div>
              <div className="status-row">
                <span className="status-label">Retention Period</span>
                <span className="status-value">
                  {loading.policy
                    ? "Loading..."
                    : errors.policy
                      ? "Error"
                      : policy?.configured
                        ? `${policy.retention_days} days`
                        : "Not configured"}
                </span>
              </div>
              <div className="status-row">
                <span className="status-label">Export Packs</span>
                <span className="status-value">No packs requested</span>
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <Lock size={14} />
              <h3>Access Control</h3>
            </div>
            <div className="access-list">
              <div className="access-row">
                <span className="access-label">Retention Read</span>
                <StatusChip
                  status={
                    loading.rbac
                      ? "pending"
                      : errors.rbac
                        ? "error"
                        : rbac?.retention_read === "granted"
                          ? "success"
                          : "warning"
                  }
                >
                  {loading.rbac
                    ? "Pending"
                    : errors.rbac
                      ? "Error"
                      : rbac?.retention_read === "granted"
                        ? "Granted"
                        : "Pending setup"}
                </StatusChip>
              </div>
              <div className="access-row">
                <span className="access-label">Export Request</span>
                <StatusChip
                  status={
                    loading.rbac
                      ? "pending"
                      : errors.rbac
                        ? "error"
                        : rbac?.export_request === "granted"
                          ? "success"
                          : "warning"
                  }
                >
                  {loading.rbac
                    ? "Pending"
                    : errors.rbac
                      ? "Error"
                      : rbac?.export_request === "granted"
                        ? "Granted"
                        : "Pending setup"}
                </StatusChip>
              </div>
            </div>
          </div>

          {/* About Compliance */}
          <div className="sidebar-panel">
            <div className="panel-header">
              <Info size={14} />
              <h3>About Compliance</h3>
            </div>
            <div className="about-content">
              <p>
                <strong>Audit Logging</strong>
                <br />
                All compliance-related actions are logged with timestamp and
                user attribution.
              </p>
              <p>
                <strong>Evidence Retention</strong>
                <br />
                Manage how long evidence and audit data is retained before
                automatic purge.
              </p>
              <p>
                <strong>Export Packs</strong>
                <br />
                Generate comprehensive export packages for auditors and
                regulators.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
