"use client";

import { useEffect, useState, useCallback } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { FileText, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Invoice = {
  id: string;
  customer_name?: string | null;
  amount_due: number;
  due_date?: string | null;
  status?: string | null;
};

/**
 * P0 FIX: Auth Propagation
 * - Uses useApi() hook for org context and auth headers
 * - Gates fetch behind isLoaded to prevent fetching before Clerk is ready
 */
export default function InvoicesPage() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Invoice[]>("/api/invoices");
      setInvoices(data);
    } catch (err) {
      // P1 FIX: Surface errors to user instead of silent failure
      setError(err instanceof Error ? err.message : "Failed to load invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    if (!authReady) return;
    fetchInvoices();
  }, [authReady, fetchInvoices]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <RouteShell
      title="Invoices"
      subtitle="Track accounts receivable and payment status."
    >
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInvoices}
            className="text-red-400 hover:text-red-300"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-card/20 rounded" />
          <div className="h-10 bg-card/20 rounded" />
        </div>
      ) : error ? null : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mb-4">
            <FileText className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-foreground font-medium mb-2">No Invoices Yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            ReconAI automatically imports invoices from your connected bank
            accounts and accounting integrations. Once synced, your receivables
            will appear here for tracking and reconciliation.
          </p>
          <p className="text-muted-foreground text-xs">
            Next step: Connect a bank account or accounting platform to start
            importing data.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-card/60 p-3"
            >
              <FileText className="h-4 w-4 text-green-400" />
              <div className="flex-1">
                <span className="text-foreground text-sm">
                  {inv.customer_name ?? "Unknown customer"}
                </span>
                {inv.due_date && (
                  <span className="text-muted-foreground text-xs ml-2">
                    Due: {new Date(inv.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <span className="text-green-400 font-mono text-sm">
                {formatCurrency(inv.amount_due)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </RouteShell>
  );
}
