interface DashboardHeroProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function DashboardHero({
  title,
  subtitle,
  children,
}: DashboardHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-background p-8">
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-muted/40 via-background to-background" />
      <div className="absolute inset-0 -z-20 opacity-40 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[32px_32px]" />
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
