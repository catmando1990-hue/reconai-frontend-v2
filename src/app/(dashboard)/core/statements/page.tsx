"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { Button } from "@/components/ui/button";
import { StatusChip, type StatusVariant } from "@/components/dashboard/StatusChip";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";

/**
 * Bank Statements Page
 * 
 * Allows customers to upload bank statements (PDF, CSV, OFX, QFX)
 * linked to specific accounts. User-scoped storage in Supabase.
 */

interface BankStatement {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  status: "uploaded" | "pending" | "processing" | "processed" | "error";
  account_id: string;
  account_name?: string;
  statement_date?: string;
  uploaded_at: string;
  processed_at?: string;
  transaction_count?: number;
  error_message?: string;
}

interface LinkedAccount {
  account_id: string;
  name: string;
  official_name?: string;
  mask?: string;
  type: string;
  subtype?: string;
  institution_name?: string;
}

const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".ofx", ".qfx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(status: BankStatement["status"]): StatusVariant {
  switch (status) {
    case "uploaded":
    case "processed":
      return "ok";
    case "processing":
    case "pending":
      return "warn";
    case "error":
      return "warn"; // StatusChip has no "error" variant
    default:
      return "muted";
  }
}

function getStatusIcon(status: BankStatement["status"]) {
  switch (status) {
    case "uploaded":
    case "processed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "processing":
      return <Clock className="h-4 w-4 animate-pulse" />;
    case "error":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

export default function StatementsPage() {
  const { getToken } = useAuth();
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/plaid/stored-accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
      // Auto-select first account if none selected
      if (data.accounts?.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data.accounts[0].account_id);
      }
    } catch (e) {
      console.error("Failed to fetch accounts:", e);
    }
  }, [getToken, selectedAccountId]);

  const fetchStatements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const url = selectedAccountId
        ? `/api/statements?account_id=${selectedAccountId}`
        : "/api/statements";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch statements");
      const data = await res.json();
      setStatements(data.statements || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load statements");
    } finally {
      setLoading(false);
    }
  }, [getToken, selectedAccountId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!selectedAccountId) {
      setError("Please select an account first");
      return;
    }

    const file = files[0];
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("account_id", selectedAccountId);

      const res = await fetch("/api/statements/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      await fetchStatements();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this statement? This cannot be undone.")) return;

    try {
      const token = await getToken();
      const res = await fetch(`/api/statements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Delete failed");
      await fetchStatements();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleDownload = async (statement: BankStatement) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/statements/${statement.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = statement.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const selectedAccount = accounts.find((a) => a.account_id === selectedAccountId);

  return (
    <RouteShell
      title="Bank Statements"
      subtitle="Upload bank statements for historical records"
      right={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchStatements()}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto text-xs underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Account Selector */}
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Select Account
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left hover:border-primary/50 transition-colors"
            >
              {selectedAccount ? (
                <div>
                  <p className="font-medium">{selectedAccount.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedAccount.institution_name} •••• {selectedAccount.mask}
                  </p>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {accounts.length === 0 ? "No accounts linked" : "Select an account"}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {showAccountDropdown && accounts.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                {accounts.map((account) => (
                  <button
                    key={account.account_id}
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(account.account_id);
                      setShowAccountDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg ${
                      account.account_id === selectedAccountId ? "bg-muted/30" : ""
                    }`}
                  >
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.institution_name} •••• {account.mask} • {account.type}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div
          className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            !selectedAccountId
              ? "border-border/50 bg-muted/20 cursor-not-allowed"
              : dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onDragEnter={selectedAccountId ? handleDrag : undefined}
          onDragLeave={selectedAccountId ? handleDrag : undefined}
          onDragOver={selectedAccountId ? handleDrag : undefined}
          onDrop={selectedAccountId ? handleDrop : undefined}
        >
          {selectedAccountId && (
            <input
              type="file"
              accept={ALLOWED_EXTENSIONS.join(",")}
              onChange={(e) => handleUpload(e.target.files)}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={uploading || !selectedAccountId}
            />
          )}
          <div className="flex flex-col items-center gap-4">
            <div className={`rounded-full p-4 ${selectedAccountId ? "bg-muted" : "bg-muted/50"}`}>
              <Upload className={`h-8 w-8 ${selectedAccountId ? "text-muted-foreground" : "text-muted-foreground/50"}`} />
            </div>
            <div>
              <p className={`text-lg font-medium ${!selectedAccountId ? "text-muted-foreground" : ""}`}>
                {!selectedAccountId
                  ? "Select an account to upload statements"
                  : uploading
                  ? "Uploading..."
                  : "Drop statement here or click to upload"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Supported formats: PDF, CSV, OFX, QFX • Max size: 10MB
              </p>
            </div>
            <Button variant="outline" disabled={uploading || !selectedAccountId}>
              {uploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Statements List */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold">Uploaded Statements</h2>
            <p className="text-sm text-muted-foreground">
              {statements.length} statement{statements.length !== 1 ? "s" : ""}{" "}
              {selectedAccountId ? "for this account" : "total"}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : statements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No statements uploaded yet
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedAccountId
                  ? "Upload your first bank statement to get started"
                  : "Select an account to view its statements"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {statements.map((statement) => (
                <div
                  key={statement.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{statement.file_name}</p>
                      <StatusChip variant={getStatusVariant(statement.status)}>
                        {getStatusIcon(statement.status)}
                        <span className="ml-1 capitalize">{statement.status}</span>
                      </StatusChip>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatFileSize(statement.file_size)}</span>
                      <span>•</span>
                      <span>Uploaded {formatDate(statement.uploaded_at)}</span>
                      {statement.account_name && (
                        <>
                          <span>•</span>
                          <span>{statement.account_name}</span>
                        </>
                      )}
                    </div>
                    {statement.error_message && (
                      <p className="mt-1 text-xs text-destructive">
                        {statement.error_message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(statement)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(statement.id)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="font-medium">About Bank Statement Uploads</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Statements are linked to specific accounts for organization</li>
            <li>• PDF, CSV, OFX, and QFX formats are supported</li>
            <li>• Uploaded files are encrypted at rest in Supabase Storage</li>
            <li>• Only you can access your uploaded statements</li>
          </ul>
        </div>
      </div>
    </RouteShell>
  );
}
