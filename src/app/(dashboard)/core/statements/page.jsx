"use client";

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Upload,
  Building2,
  ChevronDown,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileWarning,
  Link2,
  X,
  RefreshCw,
} from 'lucide-react';
import '@/styles/core/Statements.css';

// Allowed file types and max size
const ALLOWED_EXTENSIONS = ['.pdf', '.csv', '.ofx', '.qfx', '.qbo'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Status configurations
const STATUS_CONFIG = {
  uploaded: { label: 'Uploaded', icon: CheckCircle, className: 'uploaded' },
  pending: { label: 'Pending', icon: Clock, className: 'pending' },
  processing: { label: 'Processing', icon: Loader2, className: 'processing' },
  processed: { label: 'Processed', icon: CheckCircle, className: 'processed' },
  error: { label: 'Error', icon: AlertCircle, className: 'error' },
};

// Mock linked accounts
const mockAccounts = [
  { id: 'acc_001', name: 'Chase Business Checking', mask: '4521', institution: 'Chase' },
  { id: 'acc_002', name: 'Bank of America Savings', mask: '8834', institution: 'Bank of America' },
  { id: 'acc_003', name: 'American Express Platinum', mask: '1004', institution: 'American Express' },
];

// Mock statement records
const mockStatements = [
  {
    id: 'stmt_001',
    file_name: 'chase_march_2024.pdf',
    file_type: 'application/pdf',
    file_size: 1258291, // bytes
    storage_path: '/statements/chase_march_2024.pdf',
    status: 'processed',
    account_id: 'acc_001',
    statement_date: '2024-03-31',
    uploaded_at: '2024-04-01T10:30:00Z',
    processed_at: '2024-04-01T10:32:15Z',
    transaction_count: 156,
    error_message: null,
  },
  {
    id: 'stmt_002',
    file_name: 'chase_february_2024.pdf',
    file_type: 'application/pdf',
    file_size: 1126400,
    storage_path: '/statements/chase_february_2024.pdf',
    status: 'processed',
    account_id: 'acc_001',
    statement_date: '2024-02-29',
    uploaded_at: '2024-03-01T09:15:00Z',
    processed_at: '2024-03-01T09:18:42Z',
    transaction_count: 142,
    error_message: null,
  },
  {
    id: 'stmt_003',
    file_name: 'bofa_march_2024.pdf',
    file_type: 'application/pdf',
    file_size: 467200,
    storage_path: '/statements/bofa_march_2024.pdf',
    status: 'processing',
    account_id: 'acc_002',
    statement_date: '2024-03-31',
    uploaded_at: '2024-04-01T14:22:00Z',
    processed_at: null,
    transaction_count: null,
    error_message: null,
  },
  {
    id: 'stmt_004',
    file_name: 'amex_march_2024.csv',
    file_type: 'text/csv',
    file_size: 89600,
    storage_path: '/statements/amex_march_2024.csv',
    status: 'error',
    account_id: 'acc_003',
    statement_date: '2024-03-31',
    uploaded_at: '2024-04-02T08:45:00Z',
    processed_at: null,
    transaction_count: null,
    error_message: 'Invalid date format in row 23',
  },
  {
    id: 'stmt_005',
    file_name: 'chase_january_2024.pdf',
    file_type: 'application/pdf',
    file_size: 1003520,
    storage_path: '/statements/chase_january_2024.pdf',
    status: 'processed',
    account_id: 'acc_001',
    statement_date: '2024-01-31',
    uploaded_at: '2024-02-01T11:00:00Z',
    processed_at: '2024-02-01T11:03:22Z',
    transaction_count: 128,
    error_message: null,
  },
  {
    id: 'stmt_006',
    file_name: 'amex_february_2024.pdf',
    file_type: 'application/pdf',
    file_size: 896000,
    storage_path: '/statements/amex_february_2024.pdf',
    status: 'uploaded',
    account_id: 'acc_003',
    statement_date: '2024-02-29',
    uploaded_at: '2024-04-02T09:00:00Z',
    processed_at: null,
    transaction_count: null,
    error_message: null,
  },
];

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getFileExtension(filename) {
  return '.' + filename.split('.').pop().toLowerCase();
}

function validateFile(file) {
  const errors = [];

  // Check extension
  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`);
  }

  return errors;
}

// Loading State
function LoadingState() {
  return (
    <div className="statements-state loading">
      <Loader2 size={40} className="spinner" />
      <p>Loading statements...</p>
    </div>
  );
}

// Error State
function ErrorState({ message, onRetry }) {
  return (
    <div className="statements-state error">
      <AlertCircle size={40} />
      <h3>Unable to load statements</h3>
      <p>{message}</p>
      <button className="retry-btn" onClick={onRetry}>Try Again</button>
    </div>
  );
}

// Empty State
function EmptyState({ hasAccounts }) {
  if (!hasAccounts) {
    return (
      <div className="statements-state empty">
        <div className="empty-icon">
          <Building2 size={32} />
        </div>
        <h3>No accounts connected</h3>
        <p>Connect a bank account first to upload and manage statements.</p>
        <a href="/core/bank-connections" className="connect-btn">
          <Link2 size={16} />
          Connect Bank Account
        </a>
      </div>
    );
  }

  return (
    <div className="statements-state empty">
      <div className="empty-icon">
        <FileText size={32} />
      </div>
      <h3>No statements uploaded</h3>
      <p>Upload bank statements to reconcile against imported transactions.</p>
    </div>
  );
}

// Status Chip
function StatusChip({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.uploaded;
  const Icon = config.icon;

  return (
    <span className={`status-chip ${config.className}`}>
      <Icon size={12} className={status === 'processing' ? 'spinner' : ''} />
      {config.label}
    </span>
  );
}

// Statement Row
function StatementRow({ statement, account, onDownload, onDelete, isDeleting }) {
  return (
    <tr className={statement.status === 'error' ? 'has-error' : ''}>
      <td className="file-col">
        <div className="file-info">
          <FileText size={18} />
          <div>
            <span className="file-name">{statement.file_name}</span>
            <span className="file-meta">{formatFileSize(statement.file_size)}</span>
          </div>
        </div>
      </td>
      <td className="account-col">
        <span className="account-name">{account?.name || 'Unknown'}</span>
      </td>
      <td className="date-col">{formatDate(statement.statement_date)}</td>
      <td className="status-col">
        <StatusChip status={statement.status} />
        {statement.error_message && (
          <span className="error-tooltip" title={statement.error_message}>
            <AlertCircle size={14} />
          </span>
        )}
      </td>
      <td className="txn-col">
        {statement.transaction_count !== null ? statement.transaction_count : '—'}
      </td>
      <td className="uploaded-col">{formatDateTime(statement.uploaded_at)}</td>
      <td className="actions-col">
        <button
          className="action-btn download"
          onClick={() => onDownload(statement.id)}
          title="Download"
          disabled={statement.status === 'processing'}
        >
          <Download size={16} />
        </button>
        <button
          className="action-btn delete"
          onClick={() => onDelete(statement.id)}
          title="Delete"
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 size={16} className="spinner" /> : <Trash2 size={16} />}
        </button>
      </td>
    </tr>
  );
}

export default function Statements() {
  // State
  const [accounts, setAccounts] = useState([]);
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);

  // Load accounts and statements
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        setAccounts(mockAccounts);
        setStatements(mockStatements);

        // Auto-select first account if none selected
        if (mockAccounts.length > 0) {
          // Keep 'all' as default for better UX
        }
      } catch (err) {
        setError('Failed to load statements. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter statements by selected account
  const filteredStatements = selectedAccountId === 'all'
    ? statements
    : statements.filter(s => s.account_id === selectedAccountId);

  // Get account by ID
  const getAccount = (accountId) => accounts.find(a => a.id === accountId);

  // Handle file selection
  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate account selected
    if (selectedAccountId === 'all') {
      setUploadError('Please select a specific account before uploading.');
      return;
    }

    // Validate file
    const errors = validateFile(file);
    if (errors.length > 0) {
      setUploadError(errors.join(' '));
      return;
    }

    // Clear previous errors
    setUploadError(null);

    // Upload file
    uploadFile(file);
  };

  // Upload file
  const uploadFile = async (file) => {
    setUploading(true);
    setUploadError(null);

    try {
      // Simulate FormData upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('account_id', selectedAccountId);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add new statement to list
      const newStatement = {
        id: `stmt_${Date.now()}`,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: `/statements/${file.name}`,
        status: 'uploaded',
        account_id: selectedAccountId,
        statement_date: new Date().toISOString().split('T')[0],
        uploaded_at: new Date().toISOString(),
        processed_at: null,
        transaction_count: null,
        error_message: null,
      };

      setStatements(prev => [newStatement, ...prev]);
    } catch (err) {
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Handle download
  const handleDownload = (statementId) => {
    const statement = statements.find(s => s.id === statementId);
    if (statement) {
      // In real app, would trigger file download
      console.log('Downloading:', statement.file_name);
    }
  };

  // Handle delete with double-click protection
  const handleDelete = async (statementId) => {
    // Prevent double-click
    if (deletingId) return;

    const statement = statements.find(s => s.id === statementId);
    if (!statement) return;

    if (!window.confirm(`Delete "${statement.file_name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(statementId);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatements(prev => prev.filter(s => s.id !== statementId));
    } catch (err) {
      setUploadError('Failed to delete statement. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Retry loading
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Re-trigger useEffect
    setTimeout(() => {
      setAccounts(mockAccounts);
      setStatements(mockStatements);
      setLoading(false);
    }, 800);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="statements-page">
        <div className="page-header">
          <div>
            <h1>Statements</h1>
            <p>Upload and manage bank statements</p>
          </div>
        </div>
        <LoadingState />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="statements-page">
        <div className="page-header">
          <div>
            <h1>Statements</h1>
            <p>Upload and manage bank statements</p>
          </div>
        </div>
        <ErrorState message={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Render empty state if no accounts
  if (accounts.length === 0) {
    return (
      <div className="statements-page">
        <div className="page-header">
          <div>
            <h1>Statements</h1>
            <p>Upload and manage bank statements</p>
          </div>
        </div>
        <EmptyState hasAccounts={false} />
      </div>
    );
  }

  return (
    <div className="statements-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Statements</h1>
          <p>Upload and manage bank statements</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-header">
          <h3>Upload Statement</h3>
          <div className="account-selector">
            <Building2 size={16} />
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                setUploadError(null);
              }}
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (...{acc.mask})
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
        </div>

        <div
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''} ${selectedAccountId === 'all' ? 'disabled' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => selectedAccountId !== 'all' && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={selectedAccountId === 'all' || uploading}
          />

          {uploading ? (
            <>
              <Loader2 size={32} className="spinner" />
              <p>Uploading...</p>
            </>
          ) : (
            <>
              <Upload size={32} />
              <p>
                {selectedAccountId === 'all'
                  ? 'Select an account first'
                  : 'Drag & drop or click to upload'}
              </p>
              <span className="upload-hint">
                Supported: {ALLOWED_EXTENSIONS.join(', ')} (max {formatFileSize(MAX_FILE_SIZE)})
              </span>
            </>
          )}
        </div>

        {uploadError && (
          <div className="upload-error">
            <AlertCircle size={14} />
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Statements Table */}
      <div className="statements-section">
        <div className="section-header">
          <h3>Statement Records</h3>
          <span className="record-count">{filteredStatements.length} statements</span>
        </div>

        {filteredStatements.length === 0 ? (
          <EmptyState hasAccounts={true} />
        ) : (
          <div className="statements-table-wrapper">
            <table className="statements-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Account</th>
                  <th>Statement Date</th>
                  <th>Status</th>
                  <th>Transactions</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredStatements.map((statement) => (
                  <StatementRow
                    key={statement.id}
                    statement={statement}
                    account={getAccount(statement.account_id)}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    isDeleting={deletingId === statement.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
