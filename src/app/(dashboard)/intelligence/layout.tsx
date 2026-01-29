import { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * Intelligence Module Layout
 * Wraps all /intelligence/* routes with V2 shell
 */
export default function IntelligenceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ShellV2 module="intelligence">{children}</ShellV2>;
}
