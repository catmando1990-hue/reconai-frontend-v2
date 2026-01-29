import { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * Connect Bank Layout
 * Uses Core module shell for bank connection flow
 */
export default function ConnectBankLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ShellV2 module="core">{children}</ShellV2>;
}
