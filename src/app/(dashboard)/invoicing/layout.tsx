import { ReactNode } from "react";

interface InvoicingLayoutProps {
  children: ReactNode;
}

/**
 * Invoicing Module Layout
 * Wraps all /invoicing/* routes with shared context and navigation
 */
export default function InvoicingLayout({ children }: InvoicingLayoutProps) {
  return <div className="flex flex-col h-full">{children}</div>;
}
