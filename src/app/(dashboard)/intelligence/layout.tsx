import { ReactNode } from "react";

interface IntelligenceLayoutProps {
  children: ReactNode;
}

/**
 * Intelligence Module Layout
 * Wraps all /intelligence/* routes with shared context and navigation
 */
export default function IntelligenceLayout({
  children,
}: IntelligenceLayoutProps) {
  return <div className="flex flex-col h-full">{children}</div>;
}
