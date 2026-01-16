import type { ReactNode } from "react";
import ReconUtilityHeader from "@/components/layout/ReconUtilityHeader";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-x-hidden">
      <ReconUtilityHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
