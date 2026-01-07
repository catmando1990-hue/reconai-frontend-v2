'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  Check,
  Lock,
  Rocket,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

type SegmentKey = 'solo' | 'smb' | 'contractor' | 'enterprise';

const SEGMENTS: Array<{
  key: SegmentKey;
  label: string;
  icon: React.ReactNode;
  headline: string;
  subheadline: string;
  bullets: string[];
  stats: Array<{ label: string; value: string }>;
  price: string;
}> = [
  {
    key: 'solo',
    label: 'Solo',
    icon: <Users className="h-4 w-4" />,
    headline: 'Clarity for the one-person machine.',
    subheadline:
      'Stop living in spreadsheets. ReconAI turns transactions into decisions—fast, clean, and explainable.',
    bullets: ['Auto-categorization with traceability', 'Receipts + notes in one place', 'Clean reports in minutes'],
    stats: [
      { label: 'Time-to-value', value: '< 24h' },
      { label: 'Accuracy target', value: '95%+' },
      { label: 'Setup', value: 'No consultants' },
    ],
    price: '$39/mo',
  },
  {
    key: 'smb',
    label: 'Small Business',
    icon: <Briefcase className="h-4 w-4" />,
    headline: 'Run a tighter operation with less noise.',
    subheadline:
      "See what's real: margin, burn, vendor drift, and cash flow—without drowning in tools and tabs.",
    bullets: ['Unified financial timeline', 'Cash flow + burn visibility', 'Team-ready workflows (when you scale)'],
    stats: [
      { label: 'Decision speed', value: '↑' },
      { label: 'Ops overhead', value: '↓' },
      { label: 'Reporting', value: 'Instant' },
    ],
    price: '$79/mo',
  },
  {
    key: 'contractor',
    label: 'GovCon',
    icon: <Shield className="h-4 w-4" />,
    headline: 'Built for compliance pressure.',
    subheadline:
      'DCAA-minded structure, audit-friendly reporting, and defensible classifications—without enterprise ERP pricing.',
    bullets: ['Audit-ready architecture', 'Indirect rate tracking', 'Clean evidence trails'],
    stats: [
      { label: 'Compliance posture', value: 'Strong' },
      { label: 'Implementation', value: '$0' },
      { label: 'Time saved', value: 'Hours/week' },
    ],
    price: '$99/mo',
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    icon: <Building2 className="h-4 w-4" />,
    headline: 'Enterprise-grade intelligence. Human-controlled.',
    subheadline:
      "White-label ready foundations, security-first posture, and scalable architecture that doesn't collapse under growth.",
    bullets: ['Security-forward defaults', 'Scale-ready data model', 'Enterprise support options'],
    stats: [
      { label: 'Uptime target', value: '99.9%' },
      { label: 'Latency goal', value: '< 200ms' },
      { label: 'Controls', value: 'SOC2-ready' },
    ],
    price: 'Custom',
  },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(!!mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export function MarketingHomePage() {
  const [segment, setSegment] = useState<SegmentKey>('contractor');

  const active = useMemo(() => SEGMENTS.find((s) => s.key === segment)!, [segment]);

  // Phase 5: Smooth hero tilt with rAF throttle + reduced-motion support
  const cardRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = cardRef.current;
    if (!el || prefersReducedMotion) return;

    let raf = 0;
    const handle = (e: PointerEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotY = (x - 0.5) * 10; // -5..5
      const rotX = -(y - 0.5) * 10; // -5..5

      cardRef.current.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    };

    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        handle(e);
      });
    };

    const onLeave = () => {
      if (!cardRef.current) return;
      cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove as EventListener);
      window.removeEventListener('pointerleave', onLeave as EventListener);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-24">
        {/* ambient */}
        <div className="pointer-events-none absolute -top-24 right-[-120px] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse dark:bg-primary/15" />
        <div className="pointer-events-none absolute -bottom-24 left-[-120px] h-[520px] w-[520px] rounded-full bg-secondary/15 blur-3xl motion-safe:animate-pulse dark:bg-secondary/10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              <Star className="h-4 w-4 text-primary" />
              Built for operators • audit-friendly • explainable AI
            </div>

            <h1 className="mt-6 text-5xl font-extrabold tracking-tight md:text-6xl">
              Financial intelligence
              <span className="block text-primary">you can defend</span>
            </h1>

            <p className="mt-5 text-lg text-muted-foreground">
              ReconAI replaces spreadsheets, guesswork, and fragmented tools with clear, auditable insight—built for serious
              founders, teams, and government contractors.
            </p>

            {/* Segment selector */}
            <div className="mt-8 flex flex-wrap gap-2">
              {SEGMENTS.map((s) => {
                const isActive = s.key === segment;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSegment(s.key)}
                    className={[
                      'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
                      isActive
                        ? 'border-primary/30 bg-primary/10 text-foreground'
                        : 'border-border bg-card/40 text-muted-foreground hover:bg-accent hover:text-foreground',
                    ].join(' ')}
                    aria-pressed={isActive}
                  >
                    <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>{s.icon}</span>
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold">{active.headline}</h2>
              <p className="mt-2 text-muted-foreground">{active.subheadline}</p>

              <ul className="mt-4 space-y-2">
                {active.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs - Clerk safe */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <SignedOut>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </SignedOut>

                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium transition hover:bg-accent"
                  >
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                </SignedIn>

                <Link href="/pricing" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                  See pricing ({active.price})
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
                {active.stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 blur-2xl" />
            <div
              ref={cardRef}
              className="relative rounded-3xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur transition-transform duration-200 motion-reduce:transition-none"
              style={{ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg)' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">ReconAI Overview</div>
                <div className="text-xs text-muted-foreground">Segment: {active.label}</div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-border bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Signal → Insight
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Transactions, invoices, and vendor activity become clear narratives you can explain and defend.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4 text-primary" />
                    Audit Trail
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Confidence scoring + rationale so every categorization has a defensible story.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="h-4 w-4 text-primary" />
                    Automation That You Control
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Rules first, AI second. You stay in control—always.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-background/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Award className="h-4 w-4 text-primary" />
                  Enterprise posture
                </div>
                <div className="text-xs text-muted-foreground">SOC2-ready foundations</div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Security-first defaults
                </div>
                <div className="inline-flex items-center gap-2">
                  <Rocket className="h-3.5 w-3.5" />
                  Scale-ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">Audit-ready architecture</div>
              <div className="text-xs text-muted-foreground">Defensible trails & explainable classifications</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">Secure by default</div>
              <div className="text-xs text-muted-foreground">Least-privilege patterns and strong controls</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-semibold">Built to scale</div>
              <div className="text-xs text-muted-foreground">From solo to enterprise without re-platforming</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold tracking-tight">Clarity across the entire money system</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            ReconAI connects the dots across accounts, vendors, projects, and compliance—so you always know what&apos;s true.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: <TrendingUp className="h-5 w-5" />,
                title: 'Reports that answer questions',
                desc: 'P&L, cash flow, and trend narratives with explainable breakdowns.',
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: 'Compliance-minded structure',
                desc: 'Designed with auditable trails and defensible categorizations.',
              },
              {
                icon: <Zap className="h-5 w-5" />,
                title: 'Automation you control',
                desc: 'Rules first, AI second—so it stays predictable and correct.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-accent motion-reduce:hover:translate-y-0"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-border bg-background p-2 text-primary">{f.icon}</div>
                  <div className="text-base font-semibold">{f.title}</div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{f.desc}</p>
                <div className="mt-6 h-px w-full bg-border" />
                <div className="mt-4 text-xs text-muted-foreground">Learn more →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT SHOWCASE */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Everything you need—without the tool sprawl</h3>
              <p className="mt-3 text-muted-foreground">
                Consolidate bookkeeping, reporting, and compliance posture into a single intelligence layer that scales with
                you.
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  'Unified transaction intelligence with rationale',
                  'Vendor and category drift detection',
                  'Evidence trails for audits and investor diligence',
                  'Dashboards that explain what changed and why',
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{x}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/platform"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 font-medium transition hover:bg-accent"
                >
                  Explore Platform <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/security"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Security & Trust <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 blur-2xl" />
              <div className="relative rounded-3xl border border-border bg-background/50 p-6">
                <div className="text-sm font-semibold">What ReconAI surfaces</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Not just totals—signals, explanations, and next best actions.
                </p>

                <div className="mt-6 grid gap-4">
                  {[
                    { icon: <TrendingUp className="h-4 w-4" />, t: 'Margin drift', d: 'See where profitability slips—early.' },
                    { icon: <Users className="h-4 w-4" />, t: 'Vendor anomalies', d: 'Spot duplicates, spikes, and policy misses.' },
                    { icon: <Shield className="h-4 w-4" />, t: 'Compliance posture', d: 'Know what you can defend in an audit.' },
                  ].map((r) => (
                    <div key={r.t} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-primary">{r.icon}</span>
                        {r.t}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{r.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-gradient-to-br from-card via-card to-background p-10 text-center">
          <h3 className="text-3xl font-bold tracking-tight">Move faster with confidence</h3>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            If you need your numbers to be explainable, auditable, and decision-ready—ReconAI is built for you.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <SignedOut>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 font-medium transition hover:bg-accent"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </SignedIn>
            <Link href="/contact" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
