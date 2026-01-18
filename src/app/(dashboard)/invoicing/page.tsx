import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { Panel } from "@/components/dashboard/Panel";
import { InvoiceTable } from "@/components/invoicing/InvoiceTable";

export default function InvoicingPage() {
  return (
    <RouteShell
      title="Invoicing"
      subtitle="Create invoices, track customer payments, and monitor accounts receivable."
      right={
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/invoicing/preview"
            className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Preview template
          </Link>
          <Link
            href="/dashboard/invoicing/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            New invoice
          </Link>
        </div>
      }
    >
      <Panel title="Invoices">
        <InvoiceTable />
      </Panel>
    </RouteShell>
  );
}
