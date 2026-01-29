import { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * CFO Module Layout
 * Wraps all /cfo/* routes with V2 shell
 */
export default function CfoLayout({ children }: { children: ReactNode }) {
  return <ShellV2 module="cfo">{children}</ShellV2>;
}
