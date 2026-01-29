import { ReactNode } from "react";

/**
 * Core Module Layout
 * Shell is now handled at the (dashboard) level
 */
export default function CoreLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
