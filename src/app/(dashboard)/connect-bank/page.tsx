import { ConnectBankButton } from "@/components/plaid/ConnectBankButton";
import { ConnectedAccounts } from "@/components/plaid/ConnectedAccounts";

export default function ConnectBankPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-2xl border bg-background p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect your bank
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Securely link your financial accounts. ReconAI uses Plaid Link to
          connect and will never ask for your bank password directly.
        </p>

        <div className="mt-6">
          <ConnectBankButton />
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          ReconAI is not a bank, CPA, accountant, tax advisor, or law firm.
          Outputs are informational only and require user review.
        </div>
      </section>

      <ConnectedAccounts />
    </main>
  );
}
