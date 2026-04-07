"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Link2,
  RefreshCw,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { plaidApi } from '@/api';
import '@/styles/core/Accounts.css';

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
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
        <p>Connect your first bank account to start syncing your financial data.</p>
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
              {accountCount} {accountCount === 1 ? 'account' : 'accounts'}
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
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
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
              <td className="type-col">{formatAccountType(account.type, account.subtype)}</td>
              <td className={`balance-col ${account.current < 0 ? 'negative' : ''}`}>
                {formatCurrency(account.current, account.currency)}
              </td>
              <td className="balance-col available">
                {account.available !== null ? formatCurrency(account.available, account.currency) : '—'}
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

  // Fetch accounts from backend.
  // Items: /api/plaid/items → { items: [{ item_id, institution_name, ... }] }
  // Accounts: /api/plaid/stored-accounts → { accounts: [{ item_id, name, ... }] }
  // Join by item_id.
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, accountsRes] = await Promise.all([
        plaidApi.listItems(),
        plaidApi.getStoredAccounts(),
      ]);

      const items = itemsRes?.items || (Array.isArray(itemsRes) ? itemsRes : []);
      const accounts = accountsRes?.accounts || [];

      if (items.length === 0) {
        setHasConnections(false);
        setInstitutions([]);
      } else {
        const grouped = items.map(item => ({
          institution_id: item.institution_id,
          institution_name: item.institution_name || 'Unknown Bank',
          item_id: item.item_id,
          accounts: accounts
            .filter(acc => acc.item_id === item.item_id)
            .map(acc => ({
              id: acc.account_id || acc.id,
              name: acc.name || acc.official_name || 'Account',
              type: acc.type || 'depository',
              subtype: acc.subtype || null,
              current: Number(acc.current_balance ?? 0),
              available: acc.available_balance != null ? Number(acc.available_balance) : null,
              mask: acc.mask || '****',
              currency: acc.iso_currency_code || 'USD',
            })),
        }));
        setInstitutions(grouped);
        setHasConnections(true);
      }
      setError(null);
    } catch (err) {
      console.error('[Accounts] Failed to fetch:', err);
      setError('Failed to fetch accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleRemoveConnection = (itemId) => {
    // In real app, this would call API to remove the Plaid item
    if (window.confirm('Are you sure you want to remove this bank connection? All associated accounts will be unlinked.')) {
      setInstitutions(prev => prev.filter(inst => inst.item_id !== itemId));
    }
  };

  const handleRefreshConnection = async (itemId) => {
    setRefreshingItems(prev => new Set([...prev, itemId]));
    try {
      await plaidApi.syncTransactions({ itemId });
      await fetchAccounts(); // Refresh all account data
    } catch (err) {
      console.error('[Accounts] Refresh failed:', err);
    } finally {
      setRefreshingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Calculate total accounts
  const totalAccounts = institutions.reduce((sum, inst) => sum + inst.accounts.length, 0);

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
            {institutions.length} {institutions.length === 1 ? 'institution' : 'institutions'} &middot; {totalAccounts} {totalAccounts === 1 ? 'account' : 'accounts'}
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
