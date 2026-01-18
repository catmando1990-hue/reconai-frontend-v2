import { ReactNode } from "react";

export function PanelSurface({ children }: { children: ReactNode }) {
  return <div className="surface-panel rounded-lg p-4">{children}</div>;
}
