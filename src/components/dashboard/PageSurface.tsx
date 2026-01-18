import { ReactNode } from "react";

export function PageSurface({ children }: { children: ReactNode }) {
  return <div className="surface-page rounded-xl p-6">{children}</div>;
}
