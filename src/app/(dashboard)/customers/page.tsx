"use client";

import { useEffect, useState, useCallback } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Users, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Customer = {
  id: string;
  name: string;
  email?: string | null;
};

/**
 * P0 FIX: Auth Propagation
 * - Uses useApi() hook for org context and auth headers
 * - Gates fetch behind isLoaded to prevent fetching before Clerk is ready
 */
export default function CustomersPage() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Customer[]>("/api/customers");
      setCustomers(data);
    } catch (err) {
      // P1 FIX: Surface errors to user instead of silent failure
      setError(err instanceof Error ? err.message : "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    if (!authReady) return;
    fetchCustomers();
  }, [authReady, fetchCustomers]);

  return (
    <RouteShell
      title="Customers"
      subtitle="Manage your customer relationships."
    >
      {/* P1 FIX: Error state banner */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">
                Failed to load customers
              </p>
              <p className="text-xs text-destructive/80 mt-1">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCustomers}
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
      ) : error ? null : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 mb-4">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-foreground font-medium mb-2">No Customers Yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Customer records are automatically created when ReconAI processes
            your invoices and transactions. Track customer relationships,
            payment history, and receivables status.
          </p>
          <p className="text-muted-foreground text-xs">
            Next step: Import invoices to automatically populate your customer
            list.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {customers.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-card/60 p-3"
            >
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-foreground text-sm">{c.name}</span>
              {c.email && (
                <span className="text-muted-foreground text-xs ml-auto">
                  {c.email}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </RouteShell>
  );
}
