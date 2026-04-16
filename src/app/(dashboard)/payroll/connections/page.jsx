"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Info,
  Landmark,
  Loader2,
  Lock,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";

import { payrollConnectionsApi, plaidApi } from "@/api";
import { PAYROLL_PURPOSES } from "@/api/payrollConnections";
import "@/styles/payroll/PayrollConnections.css";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "payroll", label: "Payroll" },
];

const PURPOSE_LABELS = {
  payroll_funding: "Payroll funding",
  tax_payments: "Tax payments",
  benefits: "Benefits",
  general: "General",
};

const securityFeatures = [
  { icon: Lock, text: "Bank-level 256-bit encryption" },
  { icon: Shield, text: "Read-only access — no transactions" },
  { icon: CheckCircle, text: "SOC 2 Type II compliant" },
];

function ConnectionRow({ conn, onDelete, deleting }) {
  return (
    <div className="connection-row">
      <div className="connection-info">
        <span className="connection-name">{conn.account_name || conn.institution_name || "Account"}</span>
        <span className="connection-meta">
          {conn.institution_name}
          {conn.account_type ? ` · ${conn.account_type}` : ""}
          {conn.purpose ? ` · ${PURPOSE_LABELS[conn.purpose] || conn.purpose}` : ""}
          {conn.connection_type === "manual" ? " · Manual" : " · Plaid"}
        </span>
      </div>
      <span className={`connection-status ${conn.status}`}>{conn.status}</span>
      <button
        type="button"
        className="connection-delete"
        onClick={() => onDelete(conn.id)}
        disabled={deleting}
        aria-label={`Remove ${conn.account_name || conn.institution_name}`}
      >
        {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}

function ManualEntryModal({ open, onClose, onSubmit, submitting }) {
  const [institutionName, setInstitutionName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [accountMask, setAccountMask] = useState("");
  const [purpose, setPurpose] = useState("general");

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      institutionName,
      accountName,
      accountType,
      accountMask: accountMask || undefined,
      purpose,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Add account manually</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Institution name
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              maxLength={100}
              required
            />
          </label>
          <label>
            Account name
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              maxLength={100}
              required
            />
          </label>
          <label>
            Account type
            <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Purpose
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {PAYROLL_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {PURPOSE_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Last 4 digits (optional)
            <input
              type="text"
              value={accountMask}
              onChange={(e) => setAccountMask(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="spin" /> : "Add account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PayrollConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkToken, setLinkToken] = useState(null);
  const [linkPreparing, setLinkPreparing] = useState(false);
  const [pendingPurpose, setPendingPurpose] = useState("general");
  const [manualOpen, setManualOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await payrollConnectionsApi.list();
      setConnections(data?.connections || data?.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onPlaidSuccess = useCallback(
    async (publicToken, metadata) => {
      setSubmitting(true);
      try {
        await payrollConnectionsApi.createPlaid({
          publicToken,
          institutionId: metadata?.institution?.institution_id,
          institutionName: metadata?.institution?.name,
          purpose: pendingPurpose,
        });
        await refresh();
      } catch (err) {
        setError(err?.message || "Failed to save connection.");
      } finally {
        setSubmitting(false);
        setLinkToken(null);
      }
    },
    [refresh, pendingPurpose],
  );

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => setLinkToken(null),
  });

  useEffect(() => {
    if (linkToken && plaidReady) openPlaid();
  }, [linkToken, plaidReady, openPlaid]);

  const handleConnectPlaid = async () => {
    setLinkPreparing(true);
    setError(null);
    try {
      const data = await plaidApi.createLinkToken();
      setLinkToken(data?.link_token);
    } catch (err) {
      setError(err?.message || "Failed to start bank connection.");
    } finally {
      setLinkPreparing(false);
    }
  };

  const handleManualSubmit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      await payrollConnectionsApi.createManual(payload);
      setManualOpen(false);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to add account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this connection?")) return;
    setDeletingId(id);
    try {
      await payrollConnectionsApi.remove(id);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to remove connection.");
    } finally {
      setDeletingId(null);
    }
  };

  const hasConnections = connections.length > 0;

  return (
    <div className="payroll-connections">
      <div className="connections-layout">
        <main className="connections-main">
          <header className="connections-header">
            <div className="header-content">
              <h1>Payroll Connections</h1>
              <p>
                Bank accounts used for payroll funding, tax payments, and benefits. Isolated from
                Core, CFO, GovCon, and Invoicing.
              </p>
            </div>
            <div className="header-actions">
              <label className="purpose-select">
                Purpose
                <select
                  value={pendingPurpose}
                  onChange={(e) => setPendingPurpose(e.target.value)}
                >
                  {PAYROLL_PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {PURPOSE_LABELS[p]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="connect-btn secondary"
                onClick={() => setManualOpen(true)}
              >
                <Plus size={16} />
                Add manually
              </button>
              <button
                type="button"
                className="connect-btn primary"
                onClick={handleConnectPlaid}
                disabled={linkPreparing || submitting}
              >
                {linkPreparing ? <Loader2 size={16} className="spin" /> : <Landmark size={16} />}
                Connect via Plaid
              </button>
            </div>
          </header>

          {error && (
            <div className="connections-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="connections-state loading">
              <Loader2 size={32} className="spin" />
              <p>Loading connections…</p>
            </div>
          ) : hasConnections ? (
            <div className="connections-list">
              {connections.map((conn) => (
                <ConnectionRow
                  key={conn.id}
                  conn={conn}
                  onDelete={handleDelete}
                  deleting={deletingId === conn.id}
                />
              ))}
            </div>
          ) : (
            <div className="connections-empty">
              <div className="empty-icon">
                <Building2 size={40} />
              </div>
              <h2>No accounts connected</h2>
              <p>
                Connect a bank for payroll funding, tax payments, or benefits — via Plaid or manual
                entry.
              </p>
            </div>
          )}

          <div className="security-notice">
            <div className="security-header">
              <Shield size={16} />
              <h3>Security &amp; Privacy</h3>
            </div>
            <div className="security-features">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="security-feature">
                    <Icon size={14} />
                    <span>{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="connections-sidebar">
          <div className="sidebar-panel">
            <div className="panel-header">
              <Info size={14} />
              <h3>About Payroll Connections</h3>
            </div>
            <div className="about-content">
              <p>
                <strong>Module-isolated</strong>
                <br />
                These accounts only feed Payroll features. They will not appear in Core, CFO,
                GovCon, or Invoicing.
              </p>
              <p>
                <strong>Tag by purpose</strong>
                <br />
                Mark each account as funding, tax, benefits, or general so payroll runs pull from the
                correct source.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <ManualEntryModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSubmit={handleManualSubmit}
        submitting={submitting}
      />
    </div>
  );
}
