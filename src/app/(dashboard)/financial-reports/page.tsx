"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /financial-reports to /core/reports
 * The canonical reports location is now /core/reports
 */
export default function FinancialReportsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/core/reports");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-sm text-muted-foreground">Redirecting to Reports…</p>
    </div>
  );
}
