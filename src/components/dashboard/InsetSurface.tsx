import { ReactNode } from "react";

export function InsetSurface({ children }: { children: ReactNode }) {
  return <div className="surface-inset rounded-md p-3">{children}</div>;
}
