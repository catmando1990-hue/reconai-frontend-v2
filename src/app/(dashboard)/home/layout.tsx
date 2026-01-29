import { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * Home Layout
 * Wraps /home routes with V2 shell
 */
export default function HomeLayout({ children }: { children: ReactNode }) {
  return <ShellV2 module="home">{children}</ShellV2>;
}
