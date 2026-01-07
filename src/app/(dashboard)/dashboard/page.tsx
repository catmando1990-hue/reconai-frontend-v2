'use client';

export default function DashboardPage() {
  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — your ReconAI workspace is ready.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border p-4">
          <h2 className="font-medium">Connect a bank</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Link an account to begin ingesting and classifying transactions.
          </p>
          <div className="mt-4">
            <a
              href="/connect-bank"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
              Go to bank connection →
            </a>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-medium">Recent activity</h2>
          <p className="text-sm text-muted-foreground mt-1">
            No activity yet — once statements are processed, you&apos;ll see runs and exports here.
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="font-medium">Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Spend trends, category anomalies, and merchant intelligence will appear here.
          </p>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium">Next steps</h2>
        <ol className="list-decimal ml-6 mt-2 space-y-1 text-sm text-muted-foreground">
          <li>Connect a bank account (Plaid) or upload a statement.</li>
          <li>Run the classifier to normalize merchants and categories.</li>
          <li>Review exceptions and confirm rules.</li>
          <li>Export reports for taxes, bookkeeping, or audit packets.</li>
        </ol>
      </section>
    </main>
  );
}
