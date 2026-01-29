import { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * Invoicing Module Layout
 * Wraps all /invoicing/* routes with V2 shell
 */
export default function InvoicingLayout({ children }: { children: ReactNode }) {
  return <ShellV2 module="invoicing">{children}</ShellV2>;
}
