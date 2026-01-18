import { InvoiceStatusPill } from "./InvoiceStatusPill";

export function InvoiceTable() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left">Invoice</th>
            <th className="px-4 py-2 text-left">Customer</th>
            <th className="px-4 py-2 text-left">Amount</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={4}
              className="px-4 py-6 text-center text-muted-foreground"
            >
              No invoices yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
