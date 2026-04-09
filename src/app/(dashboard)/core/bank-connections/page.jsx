"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Link2,
  Trash2,
  Loader2,
  AlertOctagon,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { plaidApi } from "@/api";
import { useAuth } from "@/context/AuthContext";
import "@/styles/core/BankConnections.css";

// Connection status types
const CONNECTION_STATUS = {
  ACTIVE: "active",
  NEEDS_REAUTH: "needs_reauth",
  ERROR: "error",
  UNKNOWN: "unknown",
};

function getRelativeTime(date) {
  if (!date) return "never";
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

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusConfig(status) {
  switch (status) {
    case CONNECTION_STATUS.ACTIVE:
      return { label: "Active", icon: CheckCircle, className: "active" };
    case CONNECTION_STATUS.NEEDS_REAUTH:
      return {
        label: "Needs Re-auth",
        icon: AlertTriangle,
        className: "reauth",
      };
    case CONNECTION_STATUS.ERROR:
      return { label: "Error", icon: XCircle, className: "error" };
    default:
      return { label: "Unknown", icon: HelpCircle, className: "unknown" };
  }
}

// Loading State
function LoadingState() {
  return (
    <div className="connections-state loading">
      <Loader2 size={40} className="spinner" />
      <p>Loading connections...</p>
    </div>
  );
}

// Preparing State (for Plaid Link initialization)
function PreparingState() {
  return (
    <div className="connections-state preparing">
      <Loader2 size={40} className="spinner" />
      <h3>Preparing...</h3>
      <p>Setting up secure connection to your bank</p>
    </div>
  );
}

// Connecting State (while Plaid Link is active)
function ConnectingState({ institutionName }) {
  return (
    <div className="connections-state connecting">
      <Loader2 size={40} className="spinner" />
      <h3>Connecting{institutionName ? ` to ${institutionName}` : "..."}</h3>
      <p>Please complete the authentication in the popup window</p>
    </div>
  );
}

// Success State (after successful connection)
function SuccessState({ institutionName, onDismiss }) {
  return (
    <div className="connections-state success">
      <CheckCircle size={48} />
      <h3>Successfully Connected!</h3>
      <p>{institutionName} has been linked to your account.</p>
      <button className="primary-btn" onClick={onDismiss}>
        Continue
      </button>
    </div>
  );
}

// Error State
function ErrorState({ message, onRetry }) {
  return (
    <div className="connections-state error">
      <AlertOctagon size={40} />
      <h3>Connection Failed</h3>
      <p>{message || "An error occurred while connecting to your bank."}</p>
      <button className="retry-btn" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

// Empty State (no connections)
function EmptyState({ canConnect, onConnect }) {
  return (
    <div className="connections-state empty">
      <div className="empty-icon">
        <Building2 size={32} />
      </div>
      <h3>No bank connections yet</h3>
      <p>
        Connect your bank accounts to start syncing transactions and balances.
      </p>
      <button
        className="connect-btn"
        onClick={onConnect}
        disabled={!canConnect}
      >
        <Link2 size={16} />
        Connect Your First Bank
      </button>
    </div>
  );
}

// Organization Gate
function OrgGate() {
  return (
    <div className="org-gate">
      <div className="org-gate-icon">
        <AlertTriangle size={24} />
      </div>
      <div className="org-gate-content">
        <h3>Organization Required</h3>
        <p>Please select an organization before connecting bank accounts.</p>
        <p className="org-gate-hint">
          Bank connections are managed at the organization level for security
          and compliance.
        </p>
      </div>
      <button className="org-select-btn" disabled>
        <Building2 size={16} />
        Select Organization First
      </button>
    </div>
  );
}

// Connection Card
function ConnectionCard({ connection, onSync, onReauth, onDelete, isSyncing }) {
  const statusConfig = getStatusConfig(connection.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`connection-card ${statusConfig.className}`}>
      <div className="connection-main">
        <div className="institution-icon">
          <Building2 size={22} />
        </div>
        <div className="connection-info">
          <h3>{connection.institution_name}</h3>
          <span className="account-count">
            {connection.account_count}{" "}
            {connection.account_count === 1 ? "account" : "accounts"}
          </span>
        </div>
        <div className={`status-badge ${statusConfig.className}`}>
          <StatusIcon size={14} />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {connection.error_message && (
        <div className="connection-alert">
          <AlertTriangle size={14} />
          <span>{connection.error_message}</span>
          {connection.status === CONNECTION_STATUS.NEEDS_REAUTH && (
            <button
              className="reauth-btn"
              onClick={() => onReauth(connection.item_id)}
            >
              <ExternalLink size={12} />
              Re-authenticate
            </button>
          )}
        </div>
      )}

      <div className="connection-footer">
        <div className="sync-info">
          <span>Last sync: {getRelativeTime(connection.last_sync)}</span>
          <span>Connected: {formatDate(connection.connected_at)}</span>
        </div>
        <div className="connection-actions">
          <button
            className="action-btn sync"
            onClick={() => onSync(connection.item_id)}
            disabled={
              isSyncing || connection.status === CONNECTION_STATUS.NEEDS_REAUTH
            }
            title="Sync now"
          >
            <RefreshCw size={16} className={isSyncing ? "spinning" : ""} />
          </button>
          <button
            className="action-btn delete"
            onClick={() => onDelete(connection.item_id)}
            title="Disconnect"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BankConnections() {
  const { isAuthenticated, org } = useAuth();

  // State
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState("idle"); // idle, preparing, connecting, success, error
  const [connectingInstitution, setConnectingInstitution] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successInstitution, setSuccessInstitution] = useState(null);
  const [syncingItems, setSyncingItems] = useState(new Set());

  const hasOrg = !!org || isAuthenticated;

  // Map backend lifecycle string → UI status
  const lifecycleToStatus = (lifecycle) => {
    switch ((lifecycle || "").toLowerCase()) {
      case "login_required":
      case "reauth_required":
        return CONNECTION_STATUS.NEEDS_REAUTH;
      case "error":
      case "failed":
        return CONNECTION_STATUS.ERROR;
      case "ready":
      case "created":
      case "pending":
      case "processing":
        return CONNECTION_STATUS.ACTIVE;
      default:
        return CONNECTION_STATUS.UNKNOWN;
    }
  };

  // Fetch connections from backend.
  // /api/plaid/items returns { items: [...] } where each item has:
  //   id, item_id, institution_id, institution_name, lifecycle,
  //   user_message, last_synced_at, created_at
  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await plaidApi.listItems();
      const items = data?.items || (Array.isArray(data) ? data : []);

      // Get stored accounts so we can attach an account count per item
      let accountsByItem = {};
      try {
        const accountsRes = await plaidApi.getStoredAccounts();
        const accounts = accountsRes?.accounts || [];
        accountsByItem = accounts.reduce((acc, a) => {
          acc[a.item_id] = (acc[a.item_id] || 0) + 1;
          return acc;
        }, {});
      } catch (err) {
        console.warn(
          "[BankConnections] Could not fetch stored accounts:",
          err.message,
        );
      }

      const normalized = items.map((item) => ({
        item_id: item.item_id,
        institution_id: item.institution_id,
        institution_name: item.institution_name || "Unknown Bank",
        account_count: accountsByItem[item.item_id] || 0,
        status: lifecycleToStatus(item.lifecycle),
        last_sync: item.last_synced_at ? new Date(item.last_synced_at) : null,
        connected_at: item.created_at,
        error_message:
          item.user_message && item.lifecycle !== "ready"
            ? item.user_message
            : undefined,
      }));
      setConnections(normalized);
    } catch (err) {
      console.error("[BankConnections] Failed to fetch items:", err);
      setPageState("error");
      setErrorMessage("Failed to load connections. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasOrg) {
      fetchConnections();
    } else {
      setLoading(false);
    }
  }, [hasOrg, fetchConnections]);

  // Handle starting a new connection via Plaid Link
  const handleStartConnection = async () => {
    setPageState("preparing");
    try {
      const linkData = await plaidApi.createLinkToken();
      // linkData contains link_token — in full integration, pass to Plaid Link SDK
      // For now, show connecting state (Plaid Link UI would open here)
      setPageState("connecting");
      setConnectingInstitution("New Bank");
      console.log("[BankConnections] Link token created:", linkData);
      // TODO: Initialize Plaid Link with linkData.link_token
      // After Plaid Link onSuccess, call plaidApi.exchangePublicToken(...)
    } catch (err) {
      console.error("[BankConnections] Failed to create link token:", err);
      setPageState("error");
      setErrorMessage(err.message || "Failed to start bank connection.");
    }
  };

  // Handle dismissing success state
  const handleDismissSuccess = () => {
    setPageState("idle");
    setSuccessInstitution(null);
    fetchConnections(); // Refresh the list
  };

  // Handle retry after error
  const handleRetry = () => {
    setPageState("idle");
    setErrorMessage(null);
  };

  // Handle sync via backend
  const handleSync = async (itemId) => {
    setSyncingItems((prev) => new Set([...prev, itemId]));
    try {
      await plaidApi.syncTransactions({ itemId });
      setConnections((prev) =>
        prev.map((conn) =>
          conn.item_id === itemId ? { ...conn, last_sync: new Date() } : conn,
        ),
      );
    } catch (err) {
      console.error("[BankConnections] Sync failed:", err);
    } finally {
      setSyncingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Handle re-auth
  const handleReauth = async (itemId) => {
    setPageState("preparing");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const connection = connections.find((c) => c.item_id === itemId);
    setConnectingInstitution(connection?.institution_name || "Bank");
    setPageState("connecting");

    // Simulate reauth
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Update connection status
    setConnections((prev) =>
      prev.map((conn) =>
        conn.item_id === itemId
          ? {
              ...conn,
              status: CONNECTION_STATUS.ACTIVE,
              last_sync: new Date(),
              error_message: undefined,
            }
          : conn,
      ),
    );

    setPageState("success");
    setSuccessInstitution(connection?.institution_name || "Bank");
    setConnectingInstitution(null);
  };

  // Handle delete
  const handleDelete = (itemId) => {
    const connection = connections.find((c) => c.item_id === itemId);
    if (
      window.confirm(
        `Are you sure you want to disconnect ${connection?.institution_name}? This will remove all linked accounts.`,
      )
    ) {
      setConnections((prev) => prev.filter((conn) => conn.item_id !== itemId));
    }
  };

  // Handle sync all
  const handleSyncAll = async () => {
    const activeConnections = connections.filter(
      (c) => c.status === CONNECTION_STATUS.ACTIVE,
    );
    const itemIds = activeConnections.map((c) => c.item_id);

    setSyncingItems(new Set(itemIds));

    await new Promise((resolve) => setTimeout(resolve, 2500));

    setConnections((prev) =>
      prev.map((conn) =>
        itemIds.includes(conn.item_id)
          ? { ...conn, last_sync: new Date() }
          : conn,
      ),
    );

    setSyncingItems(new Set());
  };

  // Calculate stats
  const activeCount = connections.filter(
    (c) => c.status === CONNECTION_STATUS.ACTIVE,
  ).length;
  const needsAttentionCount = connections.filter(
    (c) =>
      c.status === CONNECTION_STATUS.NEEDS_REAUTH ||
      c.status === CONNECTION_STATUS.ERROR,
  ).length;

  // Show org gate if no organization selected
  if (!hasOrg) {
    return (
      <div className="bank-connections-page">
        <div className="page-header">
          <div>
            <h1>Bank Connections</h1>
            <p>Manage your connected financial institutions</p>
          </div>
        </div>
        <OrgGate />
      </div>
    );
  }

  // Show page states
  if (pageState === "preparing") {
    return (
      <div className="bank-connections-page">
        <div className="page-header">
          <div>
            <h1>Bank Connections</h1>
            <p>Manage your connected financial institutions</p>
          </div>
        </div>
        <PreparingState />
      </div>
    );
  }

  if (pageState === "connecting") {
    return (
      <div className="bank-connections-page">
        <div className="page-header">
          <div>
            <h1>Bank Connections</h1>
            <p>Manage your connected financial institutions</p>
          </div>
        </div>
        <ConnectingState institutionName={connectingInstitution} />
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="bank-connections-page">
        <div className="page-header">
          <div>
            <h1>Bank Connections</h1>
            <p>Manage your connected financial institutions</p>
          </div>
        </div>
        <SuccessState
          institutionName={successInstitution}
          onDismiss={handleDismissSuccess}
        />
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="bank-connections-page">
        <div className="page-header">
          <div>
            <h1>Bank Connections</h1>
            <p>Manage your connected financial institutions</p>
          </div>
        </div>
        <ErrorState message={errorMessage} onRetry={handleRetry} />
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bank-connections-page">
        <div className="page-header">
          <div>
            <h1>Bank Connections</h1>
            <p>Manage your connected financial institutions</p>
          </div>
        </div>
        <LoadingState />
      </div>
    );
  }

  // Show empty state
  if (connections.length === 0) {
    return (
      <div className="bank-connections-page">
        <div className="page-header">
          <div>
            <h1>Bank Connections</h1>
            <p>Manage your connected financial institutions</p>
          </div>
        </div>
        <EmptyState canConnect={hasOrg} onConnect={handleStartConnection} />
      </div>
    );
  }

  // Main view with connections
  return (
    <div className="bank-connections-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Bank Connections</h1>
          <p>Manage your connected financial institutions</p>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn secondary"
            onClick={handleSyncAll}
            disabled={syncingItems.size > 0 || activeCount === 0}
            title="Sync All"
          >
            <RefreshCw
              size={18}
              className={syncingItems.size > 0 ? "spinning" : ""}
            />
          </button>
          <button
            className="icon-btn primary"
            onClick={handleStartConnection}
            title="Add Connection"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Connection Stats */}
      <div className="connection-stats">
        <div className="stat-item">
          <span className="stat-value">{connections.length}</span>
          <span className="stat-label">Total Connections</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{activeCount}</span>
          <span className="stat-label">Active</span>
        </div>
        <div
          className={`stat-item ${needsAttentionCount > 0 ? "warning" : ""}`}
        >
          <span className="stat-value">{needsAttentionCount}</span>
          <span className="stat-label">Needs Attention</span>
        </div>
      </div>

      {/* Connections List */}
      <div className="connections-section">
        <h2 className="section-title">Connected Institutions</h2>
        <div className="connections-list">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.item_id}
              connection={connection}
              onSync={handleSync}
              onReauth={handleReauth}
              onDelete={handleDelete}
              isSyncing={syncingItems.has(connection.item_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
