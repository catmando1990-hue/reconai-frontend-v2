import { Panel } from "@/components/dashboard/Panel";

export function InvoiceTotalsPanel() {
  return (
    <Panel title="Totals">
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="text-right">—</dd>
        <dt className="text-muted-foreground">Tax</dt>
        <dd className="text-right">—</dd>
        <dt className="font-medium">Total</dt>
        <dd className="text-right font-medium">—</dd>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Totals calculated once line items exist (Phase 3B).
      </p>
    </Panel>
  );
}
