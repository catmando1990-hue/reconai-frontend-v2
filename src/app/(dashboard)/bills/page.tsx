"use client";

import { useEffect, useState, useCallback } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Receipt, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Bill = {
  id: string;
  vendor_name?: string | null;
  amount_due: number;
  due_date?: string | null;
  status?: string | null;
};

/**
 * P0 FIX: Auth Propagation
 * - Uses useApi() hook for org context and auth headers
 * - Gates fetch behind isLoaded to prevent fetching before Clerk is ready
 */
export default function BillsPage() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Bill[]>("/api/bills");
      setBills(data);
    } catch (err) {
      // P1 FIX: Surface errors to user instead of silent failure
      setError(err instanceof Error ? err.message : "Failed to load bills");
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    if (!authReady) return;
    fetchBills();
  }, [authReady, fetchBills]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <RouteShell title="Bills" subtitle="Track accounts payable and due dates.">
      {/* P1 FIX: Error state banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">
                Failed to load bills
              </p>
              <p className="text-xs text-destructive/80 mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBills}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-card/20 rounded" />
          <div className="h-10 bg-card/20 rounded" />
        </div>
      ) : error ? null : bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <Receipt className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-foreground font-medium mb-2">No Bills Yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            ReconAI automatically imports bills and payables from your connected
            accounts. Track due dates, payment status, and cash flow obligations
            in one place.
          </p>
          <p className="text-muted-foreground text-xs">
            Next step: Connect a bank account or accounting platform to start
            importing bills.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bills.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-card/60 p-3"
            >
              <Receipt className="h-4 w-4 text-red-400" />
              <div className="flex-1">
                <span className="text-foreground text-sm">
                  {b.vendor_name ?? "Unknown vendor"}
                </span>
                {b.due_date && (
                  <span className="text-muted-foreground text-xs ml-2">
                    Due: {new Date(b.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <span className="text-red-400 font-mono text-sm">
                {formatCurrency(b.amount_due)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </RouteShell>
  );
}
