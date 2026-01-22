"use client";

import * as React from "react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

type Invoice = {
  id: string;
  created?: string;
  total?: number;
  currency?: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  status?: string;
};

export function InvoicesPanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Invoice[]>([]);

  const fetchInvoices = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const json = await auditedFetch<{ invoices: Invoice[]; request_id: string }>(
        `${apiBase}/api/billing/invoices`,
        { credentials: "include" },
      );
      setItems(json?.invoices || []);
    } catch (e: unknown) {
      if (e instanceof AuditProvenanceError) {
        setErr(`Provenance error: ${e.message}`);
      } else if (e instanceof HttpError) {
        setErr(`HTTP ${e.status}: ${e.message}`);
      } else {
        setErr(e instanceof Error ? e.message : "Failed to load invoices");
      }
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Invoices</div>
          <div className="text-xs opacity-70">
            Read-only invoices and receipts from Stripe.
          </div>
        </div>
        <button
          type="button"
          onClick={fetchInvoices}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm">{err}</div> : null}

      {items.length ? (
        <div className="mt-3 grid gap-2">
          {items.map((inv) => (
            <div key={inv.id} className="rounded-xl border p-3 text-sm">
              <div className="flex justify-between gap-3">
                <div className="font-mono text-xs">{inv.id}</div>
                <div className="opacity-70">{inv.status || ""}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {inv.hosted_invoice_url ? (
                  <a
                    className="underline"
                    href={inv.hosted_invoice_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Hosted invoice
                  </a>
                ) : null}
                {inv.invoice_pdf ? (
                  <a
                    className="underline"
                    href={inv.invoice_pdf}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm opacity-70">No invoices loaded.</div>
      )}
    </div>
  );
}
