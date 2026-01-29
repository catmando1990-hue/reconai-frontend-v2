import { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * Payroll Module Layout
 * Wraps all /payroll/* routes with V2 shell
 */
export default function PayrollLayout({ children }: { children: ReactNode }) {
  return <ShellV2 module="payroll">{children}</ShellV2>;
}
