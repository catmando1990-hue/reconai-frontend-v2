'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  LineChart,
  Settings,
} from 'lucide-react';

const ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/core', icon: Layers, label: 'Core' },
  { href: '/dashboard/intelligence', icon: Sparkles, label: 'Intelligence' },
  { href: '/dashboard/cfo', icon: LineChart, label: 'CFO Mode' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function SidebarRail() {
  const pathname = usePathname();

  return (
    <aside className="w-14 shrink-0 border-r border-border bg-card flex flex-col items-center py-4 gap-2">
      {ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              'h-10 w-10 flex items-center justify-center rounded-xl transition',
              active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent',
            ].join(' ')}
            title={label}
          >
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}
    </aside>
  );
}
