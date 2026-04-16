"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Info,
  Loader2,
  Lock,
  Plus,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  X,
} from "lucide-react";

import { govconConnectionsApi } from "@/api";
import { GOVCON_ACCOUNT_TYPES, GOVCON_COST_POOLS } from "@/api/govconConnections";
import "@/styles/govcon/GovConConnections.css";

const COST_POOL_LABELS = {
  direct: "Direct",
  indirect: "Indirect",
  overhead: "Overhead",
  g_and_a: "G&A",
  fringe: "Fringe",
};

const ACCOUNT_TYPE_LABELS = {
  checking: "Checking",
  savings: "Savings",
  trust: "Trust",
  escrow: "Escrow",
};

const securityFeatures = [
  { icon: Lock, text: "Manual entry only — DCAA audit trail" },
  { icon: Shield, text: "Each account requires authorization metadata" },
  { icon: CheckCircle, text: "Verification workflow before activation" },
];

function ConnectionRow({ conn, onVerify, onReject, onDelete, busyId }) {
  const isPending = conn.status === "pending_verification";
  const busy = busyId === conn.id;

  return (
    <div className={`connection-row status-${conn.status}`}>
      <div className="connection-info">
        <span className="connection-name">{conn.account_name}</span>
        <span className="connection-meta">
          {conn.institution_name}
          {conn.account_type ? ` · ${ACCOUNT_TYPE_LABELS[conn.account_type] || conn.account_type}` : ""}
          {conn.cost_pool ? ` · ${COST_POOL_LABELS[conn.cost_pool] || conn.cost_pool}` : ""}
          {conn.contract_id ? ` · Contract ${conn.contract_id}` : ""}
        </span>
        <span className="connection-meta dim">
          Authorized {conn.authorization_date} by {conn.authorized_by}
        </span>
      </div>
      <span className={`connection-status ${conn.status}`}>{conn.status.replace(/_/g, " ")}</span>
      <div className="connection-actions">
        {isPending && (
          <>
            <button
              type="button"
              className="action-btn verify"
              onClick={() => onVerify(conn.id)}
              disabled={busy}
              title="Mark verified"
            >
              {busy ? <Loader2 size={14} className="spin" /> : <ShieldCheck size={14} />}
            </button>
            <button
              type="button"
              className="action-btn reject"
              onClick={() => onReject(conn.id)}
              disabled={busy}
              title="Reject"
            >
              <ShieldOff size={14} />
            </button>
          </>
        )}
        <button
          type="button"
          className="action-btn delete"
          onClick={() => onDelete(conn.id)}
          disabled={busy}
          aria-label="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function ManualEntryModal({ open, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    institutionName: "",
    accountName: "",
    accountType: "checking",
    accountNumberMasked: "",
    routingNumberMasked: "",
    contractId: "",
    costPool: "direct",
    authorizationDate: new Date().toISOString().slice(0, 10),
    authorizedBy: "",
    evidenceDocumentId: "",
  });

  if (!open) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      contractId: form.contractId || undefined,
      accountNumberMasked: form.accountNumberMasked || undefined,
      routingNumberMasked: form.routingNumberMasked || undefined,
      evidenceDocumentId: form.evidenceDocumentId || undefined,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Add account (DCAA)</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Institution name
            <input
              type="text"
              value={form.institutionName}
              onChange={update("institutionName")}
              maxLength={100}
              required
            />
          </label>
          <label>
            Account name
            <input
              type="text"
              value={form.accountName}
              onChange={update("accountName")}
              maxLength={100}
              required
            />
          </label>
          <label>
            Account type
            <select value={form.accountType} onChange={update("accountType")}>
              {GOVCON_ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACCOUNT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Account # (last 4)
              <input
                type="text"
                value={form.accountNumberMasked}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    accountNumberMasked: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                maxLength={4}
                inputMode="numeric"
              />
            </label>
            <label>
              Routing # (last 4)
              <input
                type="text"
                value={form.routingNumberMasked}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    routingNumberMasked: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                maxLength={4}
                inputMode="numeric"
              />
            </label>
          </div>
          <label>
            Cost pool
            <select value={form.costPool} onChange={update("costPool")}>
              {GOVCON_COST_POOLS.map((p) => (
                <option key={p} value={p}>
                  {COST_POOL_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contract ID (optional)
            <input type="text" value={form.contractId} onChange={update("contractId")} />
          </label>
          <div className="form-row">
            <label>
              Authorization date
              <input
                type="date"
                value={form.authorizationDate}
                onChange={update("authorizationDate")}
                required
              />
            </label>
            <label>
              Authorized by
              <input
                type="text"
                value={form.authorizedBy}
                onChange={update("authorizedBy")}
                maxLength={100}
                required
              />
            </label>
          </div>
          <label>
            Evidence document ID (optional)
            <input
              type="text"
              value={form.evidenceDocumentId}
              onChange={update("evidenceDocumentId")}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="spin" /> : "Submit for verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GovConConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await govconConnectionsApi.list();
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

  const handleManualSubmit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      await govconConnectionsApi.createManual(payload);
      setManualOpen(false);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to add account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id) => {
    setBusyId(id);
    try {
      await govconConnectionsApi.verify(id);
      await refresh();
    } catch (err) {
      setError(err?.message || "Verification failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Rejection reason:");
    if (reason === null) return;
    setBusyId(id);
    try {
      await govconConnectionsApi.reject(id, { reason });
      await refresh();
    } catch (err) {
      setError(err?.message || "Rejection failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this connection?")) return;
    setBusyId(id);
    try {
      await govconConnectionsApi.remove(id);
      await refresh();
    } catch (err) {
      setError(err?.message || "Failed to remove connection.");
    } finally {
      setBusyId(null);
    }
  };

  const hasConnections = connections.length > 0;

  return (
    <div className="govcon-connections">
      <div className="connections-layout">
        <main className="connections-main">
          <header className="connections-header">
            <div className="header-content">
              <h1>GovCon Connections</h1>
              <p>
                DCAA-compliant manual account registration. Plaid is intentionally disabled — every
                account requires an authorization record and verification step.
              </p>
            </div>
            <div className="header-actions">
              <button
                type="button"
                className="connect-btn primary"
                onClick={() => setManualOpen(true)}
              >
                <Plus size={16} />
                Add account
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
                  onVerify={handleVerify}
                  onReject={handleReject}
                  onDelete={handleDelete}
                  busyId={busyId}
                />
              ))}
            </div>
          ) : (
            <div className="connections-empty">
              <div className="empty-icon">
                <Building2 size={40} />
              </div>
              <h2>No accounts registered</h2>
              <p>
                Add a bank account with full DCAA authorization metadata. Accounts must be verified
                before they appear in audit reports.
              </p>
            </div>
          )}

          <div className="security-notice">
            <div className="security-header">
              <Shield size={16} />
              <h3>DCAA Compliance</h3>
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
              <h3>About GovCon Connections</h3>
            </div>
            <div className="about-content">
              <p>
                <strong>Manual-only by design</strong>
                <br />
                DCAA requirements mandate human-attested authorization for every government-contract
                account. Automated bank feeds are not permitted.
              </p>
              <p>
                <strong>Verification workflow</strong>
                <br />
                Submitted accounts start as <code>pending_verification</code>. A reviewer must verify
                (or reject) before the account is included in audit packages.
              </p>
              <p>
                <strong>Cost pool tagging</strong>
                <br />
                Every account is tagged with its FAR cost pool (direct, indirect, overhead, G&A,
                fringe) for proper indirect-rate calculation.
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
