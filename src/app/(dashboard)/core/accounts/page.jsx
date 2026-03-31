"use client";

import "@/styles/core/Accounts.css";
import {
  AlertCircle,
  Building2,
  Link2,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

// Simulated account data from backend (grouped by institution)
const mockAccountData = [
  {
    institution_id: "ins_chase",
    institution_name: "Chase",
    item_id: "item_001",
    accounts: [
      {
        id: "acc_001",
        name: "Business Checking",
        type: "depository",
        subtype: "checking",
        current: 45230.5,
        available: 44850.0,
        mask: "4521",
        currency: "USD",
      },
      {
        id: "acc_002",
        name: "Business Savings",
        type: "depository",
        subtype: "savings",
        current: 28750.0,
        available: 28750.0,
        mask: "8834",
        currency: "USD",
      },
    ],
  },
  {
    institution_id: "ins_bofa",
    institution_name: "Bank of America",
    item_id: "item_002",
    accounts: [
      {
        id: "acc_003",
        name: "Advantage Checking",
        type: "depository",
        subtype: "checking",
        current: 12540.25,
        available: 12000.0,
        mask: "9912",
        currency: "USD",
      },
    ],
  },
  {
    institution_id: "ins_amex",
    institution_name: "American Express",
    item_id: "item_003",
    accounts: [
      {
        id: "acc_004",
        name: "Business Platinum Card",
        type: "credit",
        subtype: "credit card",
        current: -2340.0,
        available: 22660.0,
        mask: "1004",
        currency: "USD",
      },
      {
        id: "acc_005",
        name: "Business Gold Card",
        type: "credit",
        subtype: "credit card",
        current: -875.5,
        available: 14124.5,
        mask: "2008",
        currency: "USD",
      },
    ],
  },
  {
    institution_id: "ins_wells",
    institution_name: "Wells Fargo",
    item_id: "item_004",
    accounts: [
      {
        id: "acc_006",
        name: "Platinum Business Checking",
        type: "depository",
        subtype: "checking",
        current: 67890.0,
        available: 67890.0,
        mask: "3345",
        currency: "USD",
      },
      {
        id: "acc_007",
        name: "Business Market Rate Savings",
        type: "depository",
        subtype: "savings",
        current: 125000.0,
        available: 125000.0,
        mask: "7721",
        currency: "USD",
      },
      {
        id: "acc_008",
        name: "Business Line of Credit",
        type: "credit",
        subtype: "line of credit",
        current: -15000.0,
        available: 35000.0,
        mask: "5567",
        currency: "USD",
      },
    ],
  },
];

function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatAccountType(type, subtype) {
  if (subtype) {
    return subtype.charAt(0).toUpperCase() + subtype.slice(1);
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function LoadingState() {
  return (
    <div className="accounts-state loading">
      <Loader2 size={40} className="spinner" />
      <p>Loading accounts...</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="accounts-state error">
      <AlertCircle size={40} />
      <h3>Unable to load accounts</h3>
      <p>{message}</p>
      <button className="retry-btn">Try Again</button>
    </div>
  );
}

function EmptyState({ hasConnections }) {
  if (!hasConnections) {
    return (
      <div className="accounts-state empty">
        <div className="empty-icon">
          <Building2 size={32} />
        </div>
        <h3>No bank connected yet</h3>
        <p>
          Connect your first bank account to start syncing your financial data.
        </p>
        <a href="/core/bank-connections" className="connect-btn">
          <Link2 size={16} />
          Connect Bank Account
        </a>
      </div>
    );
  }

  return (
    <div className="accounts-state empty">
      <div className="empty-icon">
        <Building2 size={32} />
      </div>
      <h3>No accounts found</h3>
      <p>Connect a bank first to view your accounts.</p>
      <a href="/core/bank-connections" className="connect-btn">
        <Link2 size={16} />
        Connect Bank Account
      </a>
    </div>
  );
}

function InstitutionPanel({ institution, onRemove, onRefresh, isRefreshing }) {
  const accountCount = institution.accounts.length;

  return (
    <div className="institution-panel">
      <div className="institution-header">
        <div className="institution-info">
          <div className="institution-icon">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="institution-name">{institution.institution_name}</h3>
            <span className="account-count">
              {accountCount} {accountCount === 1 ? "account" : "accounts"}
            </span>
          </div>
        </div>
        <div className="institution-actions">
          <button
            className="action-btn refresh"
            onClick={() => onRefresh(institution.item_id)}
            disabled={isRefreshing}
            title="Refresh accounts"
          >
            <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
          </button>
          <button
            className="action-btn remove"
            onClick={() => onRemove(institution.item_id)}
            title="Remove connection"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <table className="accounts-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Type</th>
            <th>Current</th>
            <th>Available</th>
            <th>Mask</th>
          </tr>
        </thead>
        <tbody>
          {institution.accounts.map((account) => (
            <tr key={account.id}>
              <td className="account-name-col">{account.name}</td>
              <td className="type-col">
                {formatAccountType(account.type, account.subtype)}
              </td>
              <td
                className={`balance-col ${account.current < 0 ? "negative" : ""}`}
              >
                {formatCurrency(account.current, account.currency)}
              </td>
              <td className="balance-col available">
                {account.available !== null
                  ? formatCurrency(account.available, account.currency)
                  : "—"}
              </td>
              <td className="mask-col">••••{account.mask}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Accounts() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasConnections, setHasConnections] = useState(true);
  const [refreshingItems, setRefreshingItems] = useState(new Set());

  // Simulate fetching accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Simulate success
        setInstitutions(mockAccountData);
        setHasConnections(true);
        setError(null);
      } catch (err) {
        setError("Failed to fetch accounts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleRemoveConnection = (itemId) => {
    // In real app, this would call API to remove the Plaid item
    if (
      window.confirm(
        "Are you sure you want to remove this bank connection? All associated accounts will be unlinked.",
      )
    ) {
      setInstitutions((prev) => prev.filter((inst) => inst.item_id !== itemId));
    }
  };

  const handleRefreshConnection = async (itemId) => {
    setRefreshingItems((prev) => new Set([...prev, itemId]));

    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setRefreshingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  // Calculate total accounts
  const totalAccounts = institutions.reduce(
    (sum, inst) => sum + inst.accounts.length,
    0,
  );

  // Render states
  if (loading) {
    return (
      <div className="accounts-page">
        <div className="page-header">
          <h1>Accounts</h1>
          <p>Linked accounts, balances, and connection health</p>
        </div>
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="accounts-page">
        <div className="page-header">
          <h1>Accounts</h1>
          <p>Linked accounts, balances, and connection health</p>
        </div>
        <ErrorState message={error} />
      </div>
    );
  }

  if (!hasConnections || institutions.length === 0) {
    return (
      <div className="accounts-page">
        <div className="page-header">
          <h1>Accounts</h1>
          <p>Linked accounts, balances, and connection health</p>
        </div>
        <EmptyState hasConnections={hasConnections} />
      </div>
    );
  }

  return (
    <div className="accounts-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Accounts</h1>
          <p>Linked accounts, balances, and connection health</p>
        </div>
        <div className="header-meta">
          <span className="total-badge">
            {institutions.length}{" "}
            {institutions.length === 1 ? "institution" : "institutions"}{" "}
            &middot; {totalAccounts}{" "}
            {totalAccounts === 1 ? "account" : "accounts"}
          </span>
        </div>
      </div>

      {/* Institution Panels */}
      <div className="institutions-list">
        {institutions.map((institution) => (
          <InstitutionPanel
            key={institution.item_id}
            institution={institution}
            onRemove={handleRemoveConnection}
            onRefresh={handleRefreshConnection}
            isRefreshing={refreshingItems.has(institution.item_id)}
          />
        ))}
      </div>
    </div>
  );
}
