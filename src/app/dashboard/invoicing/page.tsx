
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvoicingPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoicing & Accounts Receivable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No invoices yet. Create invoices to track accounts receivable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
