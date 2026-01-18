import { RouteShell } from "@/components/dashboard/RouteShell";
import { Panel } from "@/components/dashboard/Panel";
import { InvoiceActionsBar } from "@/components/invoicing/InvoiceActionsBar";
import { InvoiceLineItemsTable } from "@/components/invoicing/InvoiceLineItemsTable";
import { InvoiceMetaPanel } from "@/components/invoicing/InvoiceMetaPanel";
import { InvoiceTotalsPanel } from "@/components/invoicing/InvoiceTotalsPanel";

export default function InvoicePreviewPage() {
  return (
    <RouteShell
      title="Invoice template"
      subtitle="Template-only view. Real invoices populate this layout once backend invoicing is enabled."
      right={<InvoiceActionsBar />}
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Panel title="Line items">
            <InvoiceLineItemsTable />
          </Panel>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <InvoiceMetaPanel />
          <InvoiceTotalsPanel />
        </div>
      </div>
    </RouteShell>
  );
}
