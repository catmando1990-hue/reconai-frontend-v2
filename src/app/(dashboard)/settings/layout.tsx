import { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * Settings Layout
 * Wraps /settings routes with V2 shell
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <ShellV2 module="settings">{children}</ShellV2>;
}
