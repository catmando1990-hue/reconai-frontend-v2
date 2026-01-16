"use client";

import { useEffect, useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { apiFetch } from "@/lib/api";
import { Receipt } from "lucide-react";

type ReceiptItem = {
  id: string;
  vendor_name?: string;
  amount?: number;
  date?: string;
  status?: string;
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch<ReceiptItem[]>("/api/receipts");
        if (alive) setReceipts(data);
      } catch (err) {
        // Silent fallback: show empty state with error context
        if (alive) {
          const requestId = crypto.randomUUID();
          const msg = err instanceof Error ? err.message : "Failed to load";
          setError(`${msg} (request_id: ${requestId})`);
          setReceipts([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <RouteShell title="Receipts" subtitle="Track and manage expense receipts.">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-card/20 rounded" />
          <div className="h-10 bg-card/20 rounded" />
        </div>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
            <Receipt className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="text-foreground font-medium mb-2">No Receipts Yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Receipt records are created when you upload expense documentation or
            when ReconAI processes transactions with receipt attachments.
          </p>
          {error && (
            <p className="text-muted-foreground text-xs text-amber-500">
              Note: {error}
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            Next step: Upload receipts or connect a bank account to start
            tracking expenses.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {receipts.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-card/60 p-3"
            >
              <Receipt className="h-4 w-4 text-emerald-400" />
              <span className="text-foreground text-sm">
                {r.vendor_name || "Unknown Vendor"}
              </span>
              {r.amount !== undefined && (
                <span className="text-muted-foreground text-xs ml-auto">
                  ${r.amount.toFixed(2)}
                </span>
              )}
              {r.date && (
                <span className="text-muted-foreground text-xs">
                  {new Date(r.date).toLocaleDateString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </RouteShell>
  );
}
