import { RouteShell } from "@/components/dashboard/RouteShell";
import { Panel } from "@/components/dashboard/Panel";

export default function NewInvoicePage() {
  return (
    <RouteShell
      title="Create invoice"
      subtitle="Invoice creation will be enabled once backend invoicing and payments are connected."
    >
      <Panel title="Invoice setup">
        <p className="text-sm text-muted-foreground">
          This page is intentionally stubbed until Phase 3B provides invoice
          models, persistence, and audit logging.
        </p>
      </Panel>
    </RouteShell>
  );
}
