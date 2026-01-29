import { ReactNode } from "react";

interface CfoLayoutProps {
  children: ReactNode;
}

/**
 * CFO Module Layout
 * Wraps all /cfo/* routes with shared context and navigation
 */
export default function CfoLayout({ children }: CfoLayoutProps) {
  return <div className="flex flex-col h-full">{children}</div>;
}
