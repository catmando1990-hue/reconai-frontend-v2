import { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * Documents Layout
 * Uses Core module shell for document management
 */
export default function DocumentsLayout({ children }: { children: ReactNode }) {
  return <ShellV2 module="core">{children}</ShellV2>;
}
