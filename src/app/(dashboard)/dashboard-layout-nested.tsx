import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Pass-through: avoid double DashboardShell wrapping.
  return <>{children}</>;
}
