"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
  Link2,
  Search,
  Filter,
} from "lucide-react";
import { transactionsApi } from "@/api";
import "@/styles/core/Transactions.css";

const PAGE_SIZE = 15;

const accountOptions = [
  "All Accounts",
  "Chase Business Checking",
  "Bank of America Savings",
  "American Express",
];
const statusOptions = ["All Statuses", "Posted", "Pending"];

function formatCurrency(amount) {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Positive amounts are outflows (money going out) - show with minus
  // Negative amounts are inflows (money coming in) - show with plus
  if (amount > 0) {
    return `-${formatted}`;
  } else if (amount < 0) {
    return `+${formatted}`;
  }
  return formatted;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMerchantDisplay(merchant, description) {
  const primary = merchant || description || "Unknown";
  const secondary =
    merchant && description && merchant !== description ? description : null;
  return { primary, secondary };
}

function LoadingState() {
  return (
    <div className="transactions-state loading">
      <Loader2 size={40} className="spinner" />
      <p>Loading transactions...</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="transactions-state error">
      <AlertCircle size={40} />
      <h3>Unable to load transactions</h3>
      <p>{message}</p>
      <button className="retry-btn">Try Again</button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="transactions-state empty">
      <div className="empty-icon">
        <Building2 size={32} />
      </div>
      <h3>No transactions yet</h3>
      <p>Connect a bank account to start syncing your transactions.</p>
      <a href="/core/bank-connections" className="connect-btn">
        <Link2 size={16} />
        Connect Bank Account
      </a>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasConnectedAccounts, setHasConnectedAccounts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  // Fetch transactions from backend.
  // Backend response shape: { ok, transactions, total, limit, offset }
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await transactionsApi.getTransactions({ limit: 200 });
      const txns = Array.isArray(data) ? data : data?.transactions || [];
      // Normalize backend fields to match component expectations
      const normalized = txns.map((t) => ({
        id: t.transaction_id || t.id,
        date: t.date || t.authorized_date,
        merchant: t.merchant_name || t.merchant || null,
        description: t.name || t.description || null,
        amount: t.amount,
        status: t.pending ? "pending" : t.status || "posted",
      }));
      setTransactions(normalized);
      setHasConnectedAccounts(normalized.length > 0 || (data && data.ok));
      setError(null);
    } catch (err) {
      console.error("[Transactions] Failed to fetch:", err);
      if (err.status === 404 || err.code === "NOT_FOUND") {
        setHasConnectedAccounts(false);
      } else {
        setError("Failed to fetch transactions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (t.merchant && t.merchant.toLowerCase().includes(searchLower)) ||
      (t.description && t.description.toLowerCase().includes(searchLower));
    const matchesStatus =
      selectedStatus === "All Statuses" ||
      t.status.toLowerCase() === selectedStatus.toLowerCase();

    return (searchTerm === "" || matchesSearch) && matchesStatus;
  });

  // Pagination calculations
  const totalTransactions = filteredTransactions.length;
  const totalPages = Math.ceil(totalTransactions / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalTransactions);
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAccount, selectedStatus]);

  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Render states
  if (loading) {
    return (
      <div className="transactions-page">
        <div className="page-header">
          <h1>Transactions</h1>
          <p>Synced transactions from connected accounts</p>
        </div>
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-page">
        <div className="page-header">
          <h1>Transactions</h1>
          <p>Synced transactions from connected accounts</p>
        </div>
        <ErrorState message={error} />
      </div>
    );
  }

  if (!hasConnectedAccounts || transactions.length === 0) {
    return (
      <div className="transactions-page">
        <div className="page-header">
          <h1>Transactions</h1>
          <p>Synced transactions from connected accounts</p>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Synced transactions from connected accounts</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            {accountOptions.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button className="filter-btn" title="More Filters">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card transactions-card">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((transaction) => {
              const { primary, secondary } = getMerchantDisplay(
                transaction.merchant,
                transaction.description,
              );
              const isInflow = transaction.amount < 0;

              return (
                <tr key={transaction.id}>
                  <td className="date-col">{formatDate(transaction.date)}</td>
                  <td className="merchant-col">
                    <span className="merchant-primary">{primary}</span>
                    {secondary && (
                      <span className="merchant-secondary" title={secondary}>
                        {secondary}
                      </span>
                    )}
                  </td>
                  <td
                    className={`amount-col ${isInflow ? "inflow" : "outflow"}`}
                  >
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="status-col">
                    <span className={`status-badge ${transaction.status}`}>
                      {transaction.status === "pending" ? "Pending" : "Posted"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <span className="page-info">
            Showing {startIndex + 1}–{endIndex} of {totalTransactions}
          </span>
          <div className="page-controls">
            <button
              className="page-btn"
              onClick={goToPrevious}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="page-counter">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="page-btn"
              onClick={goToNext}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
