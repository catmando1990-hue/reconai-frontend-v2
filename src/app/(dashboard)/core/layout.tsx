import { ReactNode } from "react";

interface CoreLayoutProps {
  children: ReactNode;
}

/**
 * Core Module Layout
 * Wraps all /core/* routes with shared context and navigation
 */
export default function CoreLayout({ children }: CoreLayoutProps) {
  return <div className="flex flex-col h-full">{children}</div>;
}
