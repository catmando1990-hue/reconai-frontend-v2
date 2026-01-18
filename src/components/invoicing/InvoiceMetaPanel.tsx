import { Panel } from "@/components/dashboard/Panel";

export function InvoiceMetaPanel() {
  return (
    <Panel title="Invoice details">
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted-foreground">Invoice #</dt>
        <dd className="text-right">—</dd>
        <dt className="text-muted-foreground">Issue date</dt>
        <dd className="text-right">—</dd>
        <dt className="text-muted-foreground">Due date</dt>
        <dd className="text-right">—</dd>
        <dt className="text-muted-foreground">Customer</dt>
        <dd className="text-right">—</dd>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Populated once invoices are created (Phase 3B).
      </p>
    </Panel>
  );
}
