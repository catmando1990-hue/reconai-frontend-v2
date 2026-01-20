import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { Panel } from "@/components/dashboard/Panel";

export default function ARPage() {
  return (
    <RouteShell
      title="Accounts Receivable"
      subtitle="Monitor outstanding invoices and customer payment risk."
      right={
        <Link
          href="/invoicing"
          className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Go to invoicing
        </Link>
      }
    >
      <Panel title="AR aging">
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium">Bucket</th>
                <th className="px-4 py-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {["0–30", "31–60", "61–90", "90+"].map((b) => (
                <tr key={b} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2">{b} days</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    —
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Aging balances populate once invoices are issued and statuses are
          tracked (Phase 3B).
        </p>
      </Panel>
    </RouteShell>
  );
}
