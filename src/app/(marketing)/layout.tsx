import type { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <main className="flex-1 bg-white text-zinc-900">{children}</main>;
}
