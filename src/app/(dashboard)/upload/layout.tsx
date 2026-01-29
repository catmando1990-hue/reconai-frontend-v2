import { ReactNode } from "react";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * Upload Layout
 * Uses Core module shell for file upload flow
 */
export default function UploadLayout({ children }: { children: ReactNode }) {
  return <ShellV2 module="core">{children}</ShellV2>;
}
