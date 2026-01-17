export default function GovConDashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">GovCon</h1>
      <p className="mt-2 text-sm opacity-80">
        Dedicated GovCon workspace. DCAA readiness, contracts, timekeeping, indirects, and audit artifacts live here.
      </p>
      <div className="mt-6 rounded-2xl border p-4">
        <p className="text-sm">
          No GovCon data loaded yet. Connect your GovCon sources and configure contracts to begin.
        </p>
      </div>
    </main>
  );
}
