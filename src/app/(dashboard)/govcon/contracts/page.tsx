"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { auditedFetch, HttpError } from "@/lib/auditedFetch";

interface Contract {
  id: string;
  contract_number: string;
  contract_name: string;
  agency: string | null;
  contract_type: string | null;
  start_date: string | null;
  end_date: string | null;
  total_value: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ContractFormData {
  contract_number: string;
  contract_name: string;
  agency: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  total_value: string;
  status: string;
}

const EMPTY_FORM: ContractFormData = {
  contract_number: "",
  contract_name: "",
  agency: "",
  contract_type: "",
  start_date: "",
  end_date: "",
  total_value: "",
  status: "active",
};

const CONTRACT_TYPES = [
  "FFP - Firm Fixed Price",
  "T&M - Time & Materials",
  "CPFF - Cost Plus Fixed Fee",
  "CPAF - Cost Plus Award Fee",
  "IDIQ - Indefinite Delivery/Indefinite Quantity",
];

const CONTRACT_STATUSES = ["active", "completed", "pending", "suspended"];

/**
 * GovCon Contracts Page
 *
 * CANONICAL LAWS COMPLIANCE:
 * - Full CRUD with backend integration
 * - Fail-closed: if backend unavailable, show explicit error state
 * - DCAA-compliant contract tracking
 */
export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContractFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch contracts
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditedFetch<{ contracts: Contract[] }>(
        "/api/govcon/contracts",
        { skipBodyValidation: true },
      );
      setContracts(data.contracts || []);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 401) {
          setError("Not authenticated. Please sign in.");
        } else {
          setError(`Failed to load contracts: ${err.status}`);
        }
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load contracts",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Open modal for new contract
  const handleAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (contract: Contract) => {
    setEditingId(contract.id);
    setFormData({
      contract_number: contract.contract_number,
      contract_name: contract.contract_name,
      agency: contract.agency || "",
      contract_type: contract.contract_type || "",
      start_date: contract.start_date || "",
      end_date: contract.end_date || "",
      total_value: contract.total_value?.toString() || "",
      status: contract.status,
    });
    setFormError(null);
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contract_number || !formData.contract_name) {
      setFormError("Contract number and name are required");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...(editingId && { id: editingId }),
        contract_number: formData.contract_number,
        contract_name: formData.contract_name,
        agency: formData.agency || null,
        contract_type: formData.contract_type || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        total_value: formData.total_value
          ? parseFloat(formData.total_value)
          : null,
        status: formData.status,
      };

      await auditedFetch("/api/govcon/contracts", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
        skipBodyValidation: true,
      });

      handleCloseModal();
      await fetchContracts();
    } catch (err) {
      if (err instanceof HttpError) {
        const body = err.body as { error?: string } | undefined;
        setFormError(body?.error || `Error: ${err.status}`);
      } else {
        setFormError(
          err instanceof Error ? err.message : "Failed to save contract",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete contract
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await auditedFetch(`/api/govcon/contracts?id=${deleteId}`, {
        method: "DELETE",
        skipBodyValidation: true,
      });
      setDeleteId(null);
      await fetchContracts();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (value === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get status variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "ok";
      case "completed":
        return "muted";
      case "pending":
        return "warn";
      case "suspended":
        return "warn";
      default:
        return "muted";
    }
  };

  return (
    <RouteShell
      title="Contracts"
      subtitle="DCAA-compliant contract tracking with CLIN management"
    >
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Contract Management</h2>
            <p className="text-sm text-muted-foreground">
              {contracts.length} contract{contracts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contract
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && contracts.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No contracts"
            description="Add your first contract to start tracking DCAA-compliant data."
          />
        )}

        {!loading && !error && contracts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium">Contract #</th>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Agency</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium text-right">Value</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 font-mono text-xs">
                      {contract.contract_number}
                    </td>
                    <td className="py-3">{contract.contract_name}</td>
                    <td className="py-3 text-muted-foreground">
                      {contract.agency || "—"}
                    </td>
                    <td className="py-3 text-muted-foreground text-xs">
                      {contract.contract_type?.split(" - ")[0] || "—"}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {formatCurrency(contract.total_value)}
                    </td>
                    <td className="py-3">
                      <StatusChip variant={getStatusVariant(contract.status)}>
                        {contract.status.toUpperCase()}
                      </StatusChip>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(contract)}
                          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit contract"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(contract.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete contract"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex gap-2">
            <Link
              href={ROUTES.GOVCON_AUDIT}
              className="text-xs text-primary hover:underline"
            >
              View audit trail
            </Link>
            <span className="text-xs text-muted-foreground">•</span>
            <Link
              href={ROUTES.GOVCON}
              className="text-xs text-primary hover:underline"
            >
              GovCon overview
            </Link>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-base font-semibold">
                {editingId ? "Edit Contract" : "Add Contract"}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Contract Number *
                  </label>
                  <input
                    type="text"
                    value={formData.contract_number}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        contract_number: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g., GS-35F-0001A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, status: e.target.value }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  >
                    {CONTRACT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Contract Name *
                </label>
                <input
                  type="text"
                  value={formData.contract_name}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      contract_name: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g., IT Support Services"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Agency
                  </label>
                  <input
                    type="text"
                    value={formData.agency}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, agency: e.target.value }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g., GSA, DoD, HHS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Contract Type
                  </label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        contract_type: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select type...</option>
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, start_date: e.target.value }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, end_date: e.target.value }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Total Value ($)
                  </label>
                  <input
                    type="number"
                    value={formData.total_value}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        total_value: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs text-destructive">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Update Contract"
                  ) : (
                    "Create Contract"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl">
            <h3 className="font-semibold mb-2">Delete Contract?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. The contract and all associated data
              will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </RouteShell>
  );
}
