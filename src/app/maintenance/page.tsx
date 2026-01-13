import MaintenanceStatus from "@/components/maintenance/MaintenanceStatus";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold">ReconAI Maintenance</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        ReconAI is temporarily offline for system updates and security
        improvements. Please check back shortly.
      </p>

      {/* BUILD 10: Extended maintenance status */}
      <MaintenanceStatus />
    </main>
  );
}
