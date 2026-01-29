import { ReactNode } from "react";

interface PayrollLayoutProps {
  children: ReactNode;
}

/**
 * Payroll Module Layout
 * Wraps all /payroll/* routes with shared context and navigation
 */
export default function PayrollLayout({ children }: PayrollLayoutProps) {
  return <div className="flex flex-col h-full">{children}</div>;
}
