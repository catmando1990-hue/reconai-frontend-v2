"use client";

import "@/styles/core/Transactions.css";
import {
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Link2,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

// Simulated transaction data from backend
const mockTransactions = [
  {
    id: 1,
    date: "2024-03-25",
    merchant: "Starbucks",
    description: "STARBUCKS STORE #12345",
    amount: 5.75,
    status: "posted",
  },
  {
    id: 2,
    date: "2024-03-25",
    merchant: "Amazon",
    description: "AMAZON.COM*1A2B3C4D5",
    amount: 127.43,
    status: "posted",
  },
  {
    id: 3,
    date: "2024-03-25",
    merchant: null,
    description: "ACH DEPOSIT - PAYROLL",
    amount: -3250.0,
    status: "posted",
  },
  {
    id: 4,
    date: "2024-03-24",
    merchant: "Uber",
    description: "UBER *TRIP",
    amount: 24.5,
    status: "posted",
  },
  {
    id: 5,
    date: "2024-03-24",
    merchant: "Target",
    description: "TARGET 00012345",
    amount: 89.32,
    status: "posted",
  },
  {
    id: 6,
    date: "2024-03-24",
    merchant: null,
    description: "WIRE TRANSFER IN",
    amount: -5000.0,
    status: "posted",
  },
  {
    id: 7,
    date: "2024-03-24",
    merchant: "Shell",
    description: "SHELL OIL 57442345233",
    amount: 48.72,
    status: "posted",
  },
  {
    id: 8,
    date: "2024-03-23",
    merchant: "Whole Foods",
    description: "WHOLE FOODS MKT #10234",
    amount: 156.89,
    status: "posted",
  },
  {
    id: 9,
    date: "2024-03-23",
    merchant: null,
    description: null,
    amount: 75.0,
    status: "pending",
  },
  {
    id: 10,
    date: "2024-03-23",
    merchant: "Netflix",
    description: "NETFLIX.COM",
    amount: 15.99,
    status: "posted",
  },
  {
    id: 11,
    date: "2024-03-23",
    merchant: "Spotify",
    description: "SPOTIFY USA",
    amount: 9.99,
    status: "posted",
  },
  {
    id: 12,
    date: "2024-03-22",
    merchant: null,
    description: "CHECK DEPOSIT",
    amount: -1200.0,
    status: "posted",
  },
  {
    id: 13,
    date: "2024-03-22",
    merchant: "Home Depot",
    description: "THE HOME DEPOT #4521",
    amount: 234.56,
    status: "posted",
  },
  {
    id: 14,
    date: "2024-03-22",
    merchant: "Costco",
    description: "COSTCO WHSE #1234",
    amount: 312.47,
    status: "posted",
  },
  {
    id: 15,
    date: "2024-03-22",
    merchant: "Apple",
    description: "APPLE.COM/BILL",
    amount: 0.99,
    status: "posted",
  },
  {
    id: 16,
    date: "2024-03-21",
    merchant: "Walgreens",
    description: "WALGREENS #12345",
    amount: 23.45,
    status: "posted",
  },
  {
    id: 17,
    date: "2024-03-21",
    merchant: null,
    description: "VENMO PAYMENT",
    amount: -150.0,
    status: "posted",
  },
  {
    id: 18,
    date: "2024-03-21",
    merchant: "CVS",
    description: "CVS/PHARMACY #04567",
    amount: 34.21,
    status: "pending",
  },
  {
    id: 19,
    date: "2024-03-21",
    merchant: "Chipotle",
    description: "CHIPOTLE 1234",
    amount: 12.85,
    status: "posted",
  },
  {
    id: 20,
    date: "2024-03-20",
    merchant: null,
    description: "DIRECT DEPOSIT - EMPLOYER",
    amount: -3250.0,
    status: "posted",
  },
  {
    id: 21,
    date: "2024-03-20",
    merchant: "AT&T",
    description: "ATT*BILL PAYMENT",
    amount: 85.0,
    status: "posted",
  },
  {
    id: 22,
    date: "2024-03-20",
    merchant: "Comcast",
    description: "COMCAST CABLE COMM",
    amount: 125.0,
    status: "posted",
  },
  {
    id: 23,
    date: "2024-03-19",
    merchant: "Delta",
    description: "DELTA AIR 0062345678",
    amount: 425.0,
    status: "posted",
  },
  {
    id: 24,
    date: "2024-03-19",
    merchant: "Marriott",
    description: "MARRIOTT HOTELS",
    amount: 189.0,
    status: "posted",
  },
  {
    id: 25,
    date: "2024-03-19",
    merchant: null,
    description: "ZELLE TRANSFER FROM JOHN",
    amount: -200.0,
    status: "posted",
  },
  {
    id: 26,
    date: "2024-03-18",
    merchant: "Trader Joes",
    description: "TRADER JOE'S #123",
    amount: 67.89,
    status: "posted",
  },
  {
    id: 27,
    date: "2024-03-18",
    merchant: "Petco",
    description: "PETCO ANIMAL SUPPLIES",
    amount: 45.32,
    status: "posted",
  },
  {
    id: 28,
    date: "2024-03-18",
    merchant: null,
    description: "ATM WITHDRAWAL",
    amount: 200.0,
    status: "posted",
  },
  {
    id: 29,
    date: "2024-03-17",
    merchant: "Lyft",
    description: "LYFT *RIDE",
    amount: 18.75,
    status: "posted",
  },
  {
    id: 30,
    date: "2024-03-17",
    merchant: "DoorDash",
    description: "DOORDASH*ORDER",
    amount: 32.45,
    status: "posted",
  },
];

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
  const [hasConnectedAccounts] = useState(true); // Simulated
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  // Simulate fetching transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Simulate success
        setTransactions(mockTransactions);
        setError(null);
      } catch (err) {
        setError("Failed to fetch transactions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (hasConnectedAccounts) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [hasConnectedAccounts]);

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
