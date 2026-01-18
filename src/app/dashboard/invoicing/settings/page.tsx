import { RouteShell } from "@/components/dashboard/RouteShell";
import { Panel } from "@/components/dashboard/Panel";

export default function InvoicingSettingsPage() {
  return (
    <RouteShell
      title="Invoicing settings"
      subtitle="Configure numbering, payment terms, and tax behavior. Settings become active once backend invoicing is connected."
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6 space-y-6">
          <Panel title="Invoice numbering">
            <p className="text-sm text-muted-foreground">
              Configure invoice prefixes and sequencing (e.g., INV-0001).
              Enabled in Phase 3B.
            </p>
          </Panel>
          <Panel title="Payment terms">
            <p className="text-sm text-muted-foreground">
              Standard terms (Net 15/30/45) and due date rules. Enabled in Phase
              3B.
            </p>
          </Panel>
        </div>
        <div className="lg:col-span-6 space-y-6">
          <Panel title="Tax configuration">
            <p className="text-sm text-muted-foreground">
              Tax defaults, exemptions, and jurisdiction behavior. Enabled in
              Phase 3B.
            </p>
          </Panel>
          <Panel title="Audit & exports">
            <p className="text-sm text-muted-foreground">
              Export + audit trail is manual-only and will be wired once invoice
              persistence exists (Phase 3B).
            </p>
          </Panel>
        </div>
      </div>
    </RouteShell>
  );
}
