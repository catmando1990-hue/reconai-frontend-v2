export function InvoiceLineItemsTable() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b border-border">
            <th className="px-4 py-2 text-left font-medium">Description</th>
            <th className="px-4 py-2 text-right font-medium">Qty</th>
            <th className="px-4 py-2 text-right font-medium">Rate</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-4 py-2 text-muted-foreground">
              (Template line item)
            </td>
            <td className="px-4 py-2 text-right text-muted-foreground">—</td>
            <td className="px-4 py-2 text-right text-muted-foreground">—</td>
            <td className="px-4 py-2 text-right text-muted-foreground">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
