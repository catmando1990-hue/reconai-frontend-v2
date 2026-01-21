"use client";

import { useEffect, useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { FileText } from "lucide-react";

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

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    if (!authReady) return;

    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<Invoice[]>("/api/invoices");
        if (alive) setInvoices(data);
      } catch {
        // Silent: empty array on failure
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authReady, apiFetch]);

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
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-card/20 rounded" />
          <div className="h-10 bg-card/20 rounded" />
        </div>
      ) : invoices.length === 0 ? (
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
