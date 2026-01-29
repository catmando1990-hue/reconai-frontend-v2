import { ReactNode } from "react";

/**
 * Home Layout
 * Shell is now handled at the (dashboard) level
 */
export default function HomeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
