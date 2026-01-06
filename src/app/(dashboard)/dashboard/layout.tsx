import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <main className="flex-1 bg-zinc-950 text-white">{children}</main>;
}
