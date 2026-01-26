"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Layers, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Button } from "@/components/ui/button";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { ROUTES } from "@/lib/routes";
import { auditedFetch, HttpError } from "@/lib/auditedFetch";

interface IndirectPool {
  id: string;
  pool_name: string;
  pool_type: string;
  base_type: string | null;
  rate_percentage: number | null;
  far_reference: string | null;
  allowability_status: string;
  fiscal_year: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface PoolFormData {
  pool_name: string;
  pool_type: string;
  base_type: string;
  rate_percentage: string;
  far_reference: string;
  allowability_status: string;
  fiscal_year: string;
  description: string;
}

const EMPTY_FORM: PoolFormData = {
  pool_name: "",
  pool_type: "",
  base_type: "",
  rate_percentage: "",
  far_reference: "",
  allowability_status: "pending_review",
  fiscal_year: new Date().getFullYear().toString(),
  description: "",
};

const POOL_TYPES = [
  "Fringe Benefits",
  "Overhead",
  "G&A (General & Administrative)",
  "Material Handling",
  "Facilities",
  "Other",
];

const BASE_TYPES = [
  "Direct Labor",
  "Total Direct Cost",
  "Value Added",
  "Direct Material",
  "Total Cost Input",
];

const ALLOWABILITY_STATUSES = [
  { value: "allowable", label: "Allowable" },
  { value: "unallowable", label: "Unallowable" },
  { value: "pending_review", label: "Pending Review" },
  { value: "partially_allowable", label: "Partially Allowable" },
];

const FAR_REFERENCES = [
  "FAR 31.205-6 (Compensation)",
  "FAR 31.205-14 (Entertainment)",
  "FAR 31.205-36 (Rental costs)",
  "FAR 31.205-41 (Taxes)",
  "FAR 31.205-46 (Travel)",
  "FAR 31.205-1 (Public relations)",
  "FAR 31.205-33 (Professional services)",
];

/**
 * GovCon Indirect Costs Page
 *
 * DCAA-compliant indirect rate management with FAR 31.201 allowability tracking
 */
export default function IndirectsPage() {
  const [pools, setPools] = useState<IndirectPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PoolFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch pools
  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditedFetch<{ pools: IndirectPool[] }>(
        "/api/govcon/indirects",
        { skipBodyValidation: true }
      );
      setPools(data.pools || []);
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 401) {
          setError("Not authenticated. Please sign in.");
        } else {
          setError(`Failed to load pools: ${err.status}`);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to load pools");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  // Open modal for new pool
  const handleAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (pool: IndirectPool) => {
    setEditingId(pool.id);
    setFormData({
      pool_name: pool.pool_name,
      pool_type: pool.pool_type,
      base_type: pool.base_type || "",
      rate_percentage: pool.rate_percentage?.toString() || "",
      far_reference: pool.far_reference || "",
      allowability_status: pool.allowability_status,
      fiscal_year: pool.fiscal_year.toString(),
      description: pool.description || "",
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

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pool_name || !formData.pool_type) {
      setFormError("Pool name and type are required");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...(editingId && { id: editingId }),
        pool_name: formData.pool_name,
        pool_type: formData.pool_type,
        base_type: formData.base_type || null,
        rate_percentage: formData.rate_percentage
          ? parseFloat(formData.rate_percentage)
          : null,
        far_reference: formData.far_reference || null,
        allowability_status: formData.allowability_status,
        fiscal_year: parseInt(formData.fiscal_year) || new Date().getFullYear(),
        description: formData.description || null,
      };

      await auditedFetch("/api/govcon/indirects", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
        skipBodyValidation: true,
      });

      handleCloseModal();
      await fetchPools();
    } catch (err) {
      if (err instanceof HttpError) {
        const body = err.body as { error?: string } | undefined;
        setFormError(body?.error || `Error: ${err.status}`);
      } else {
        setFormError(err instanceof Error ? err.message : "Failed to save pool");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete pool
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await auditedFetch(`/api/govcon/indirects?id=${deleteId}`, {
        method: "DELETE",
        skipBodyValidation: true,
      });
      setDeleteId(null);
      await fetchPools();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Get status variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "allowable":
        return "ok";
      case "unallowable":
        return "warn";
      case "pending_review":
        return "muted";
      case "partially_allowable":
        return "warn";
      default:
        return "muted";
    }
  };

  // Format percentage
  const formatRate = (rate: number | null) => {
    if (rate === null) return "—";
    return `${rate.toFixed(2)}%`;
  };

  return (
    <RouteShell
      title="Indirect Costs"
      subtitle="DCAA-compliant indirect rate management with FAR 31.201 allowability tracking"
    >
      <PolicyBanner
        policy="accounting"
        message="All indirect costs are reviewed against FAR 31.201-2 through 31.205-52 for allowability determination. Rate changes require evidence and are logged to the audit trail."
        context="govcon"
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Indirect Cost Pools</h2>
                <p className="text-sm text-muted-foreground">
                  {pools.length} pool{pools.length !== 1 ? "s" : ""} configured
                </p>
              </div>
              <Button size="sm" onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Pool
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

            {!loading && !error && pools.length === 0 && (
              <EmptyState
                icon={Layers}
                title="No indirect pools"
                description="Add your first indirect cost pool to track FAR 31.201 allowability."
              />
            )}

            {!loading && !error && pools.length > 0 && (
              <div className="space-y-3">
                {pools.map((pool) => (
                  <div
                    key={pool.id}
                    className="rounded-lg border border-border/70 bg-muted/30 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{pool.pool_name}</h3>
                          <StatusChip
                            variant={getStatusVariant(pool.allowability_status)}
                          >
                            {pool.allowability_status
                              .replace(/_/g, " ")
                              .toUpperCase()}
                          </StatusChip>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{pool.pool_type}</span>
                          {pool.base_type && (
                            <>
                              <span>•</span>
                              <span>Base: {pool.base_type}</span>
                            </>
                          )}
                          {pool.rate_percentage !== null && (
                            <>
                              <span>•</span>
                              <span className="font-mono">
                                {formatRate(pool.rate_percentage)}
                              </span>
                            </>
                          )}
                        </div>
                        {pool.far_reference && (
                          <p className="text-xs text-muted-foreground">
                            {pool.far_reference}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          FY {pool.fiscal_year}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(pool)}
                          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit pool"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(pool.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete pool"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex gap-2">
                <Link
                  href={ROUTES.GOVCON_CONTRACTS}
                  className="text-xs text-primary hover:underline"
                >
                  Manage contracts
                </Link>
                <span className="text-xs text-muted-foreground">•</span>
                <Link
                  href={ROUTES.GOVCON_AUDIT}
                  className="text-xs text-primary hover:underline"
                >
                  Audit trail
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Panel */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="FAR Reference" collapsible>
            <div className="space-y-2 text-sm">
              <div className="p-2 rounded bg-muted">
                <p className="font-medium">FAR 31.205-6</p>
                <p className="text-xs text-muted-foreground">
                  Compensation (subject to reasonableness)
                </p>
              </div>
              <div className="p-2 rounded bg-muted">
                <p className="font-medium">FAR 31.205-14</p>
                <p className="text-xs text-muted-foreground">
                  Entertainment (generally unallowable)
                </p>
              </div>
              <div className="p-2 rounded bg-muted">
                <p className="font-medium">FAR 31.205-36</p>
                <p className="text-xs text-muted-foreground">
                  Rental costs (allowable if reasonable)
                </p>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.GOVCON_RECONCILIATION}
                className="block text-primary hover:underline"
              >
                Run reconciliation
              </Link>
              <Link
                href={ROUTES.GOVCON_AUDIT}
                className="block text-primary hover:underline"
              >
                View audit trail
              </Link>
              <Link
                href={ROUTES.GOVCON_CONTRACTS}
                className="block text-primary hover:underline"
              >
                View contracts
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-base font-semibold">
                {editingId ? "Edit Indirect Pool" : "Add Indirect Pool"}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Pool Name *
                  </label>
                  <input
                    type="text"
                    value={formData.pool_name}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, pool_name: e.target.value }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g., Engineering Overhead"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Pool Type *
                  </label>
                  <select
                    value={formData.pool_type}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, pool_type: e.target.value }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select type...</option>
                    {POOL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Base Type
                  </label>
                  <select
                    value={formData.base_type}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, base_type: e.target.value }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select base...</option>
                    {BASE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.rate_percentage}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        rate_percentage: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g., 45.5"
                    min="0"
                    max="1000"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    FAR Reference
                  </label>
                  <select
                    value={formData.far_reference}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        far_reference: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select reference...</option>
                    {FAR_REFERENCES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Allowability Status
                  </label>
                  <select
                    value={formData.allowability_status}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        allowability_status: e.target.value,
                      }))
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  >
                    {ALLOWABILITY_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Fiscal Year
                </label>
                <input
                  type="number"
                  value={formData.fiscal_year}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, fiscal_year: e.target.value }))
                  }
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  min="2000"
                  max="2100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Optional notes..."
                />
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
                    "Update Pool"
                  ) : (
                    "Create Pool"
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
            <h3 className="font-semibold mb-2">Delete Indirect Pool?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. All rate history will be removed.
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
