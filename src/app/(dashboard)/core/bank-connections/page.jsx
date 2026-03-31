"use client";

import "@/styles/core/BankConnections.css";
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle,
  ExternalLink,
  HelpCircle,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

// Connection status types
const CONNECTION_STATUS = {
  ACTIVE: "active",
  NEEDS_REAUTH: "needs_reauth",
  ERROR: "error",
  UNKNOWN: "unknown",
};

// Simulated connection data from backend
const mockConnections = [
  {
    item_id: "item_001",
    institution_id: "ins_chase",
    institution_name: "Chase",
    account_count: 2,
    status: CONNECTION_STATUS.ACTIVE,
    last_sync: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    connected_at: "2024-01-15T10:30:00Z",
  },
  {
    item_id: "item_002",
    institution_id: "ins_bofa",
    institution_name: "Bank of America",
    account_count: 1,
    status: CONNECTION_STATUS.ACTIVE,
    last_sync: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    connected_at: "2024-02-03T14:22:00Z",
  },
  {
    item_id: "item_003",
    institution_id: "ins_amex",
    institution_name: "American Express",
    account_count: 2,
    status: CONNECTION_STATUS.NEEDS_REAUTH,
    last_sync: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    connected_at: "2023-12-20T09:15:00Z",
    error_message:
      "Your login credentials have changed. Please re-authenticate.",
  },
  {
    item_id: "item_004",
    institution_id: "ins_wells",
    institution_name: "Wells Fargo",
    account_count: 3,
    status: CONNECTION_STATUS.ERROR,
    last_sync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    connected_at: "2024-03-01T11:45:00Z",
    error_message:
      "Institution is temporarily unavailable. Please try again later.",
  },
];

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
  // State
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState("idle"); // idle, preparing, connecting, success, error
  const [connectingInstitution, setConnectingInstitution] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successInstitution, setSuccessInstitution] = useState(null);
  const [syncingItems, setSyncingItems] = useState(new Set());

  // Simulated org state - in real app this would come from context/props
  const [hasOrg, setHasOrg] = useState(true);

  // Fetch connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setConnections(mockConnections);
      } catch (err) {
        setPageState("error");
        setErrorMessage("Failed to load connections. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (hasOrg) {
      fetchConnections();
    } else {
      setLoading(false);
    }
  }, [hasOrg]);

  // Handle starting a new connection
  const handleStartConnection = async () => {
    setPageState("preparing");

    // Simulate Plaid Link token creation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setPageState("connecting");
    setConnectingInstitution("New Bank");

    // Simulate connection process (in real app, Plaid Link would handle this)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Simulate success
    setPageState("success");
    setSuccessInstitution("New Bank");
    setConnectingInstitution(null);
  };

  // Handle dismissing success state
  const handleDismissSuccess = () => {
    setPageState("idle");
    setSuccessInstitution(null);
    // In real app, would refetch connections here
  };

  // Handle retry after error
  const handleRetry = () => {
    setPageState("idle");
    setErrorMessage(null);
  };

  // Handle sync
  const handleSync = async (itemId) => {
    setSyncingItems((prev) => new Set([...prev, itemId]));

    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update last_sync time
    setConnections((prev) =>
      prev.map((conn) =>
        conn.item_id === itemId ? { ...conn, last_sync: new Date() } : conn,
      ),
    );

    setSyncingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
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
