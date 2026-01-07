'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Sparkles,
  LineChart,
  FileText,
} from 'lucide-react';

/**
 * Phase 6 Notes:
 * - Uses semantic tokens (bg-background, text-foreground, etc.) for light/dark compatibility.
 * - Uses user-provided Adobe images from /public.
 * - Subtle hero motion is throttled with requestAnimationFrame and respects prefers-reduced-motion.
 */
export function MarketingHomePage() {
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    // Check motion preference on client only
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (prefersReduced) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5..0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;  // -0.5..0.5
      targetX = Math.max(-0.5, Math.min(0.5, x));
      targetY = Math.max(-0.5, Math.min(0.5, y));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      raf = 0;
      // Smooth follow
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;

      // Write to CSS vars (small, tasteful)
      el.style.setProperty('--mx', String(curX));
      el.style.setProperty('--my', String(curY));
    };

    // Apply transform styles only on client after hydration
    el.style.transform = 'translate3d(calc(var(--mx, 0) * 10px), calc(var(--my, 0) * 10px), 0)';
    const secondaryImg = el.querySelector('[data-parallax-secondary]') as HTMLElement | null;
    if (secondaryImg) {
      secondaryImg.style.transform = 'translate3d(calc(var(--mx, 0) * -14px), calc(var(--my, 0) * -14px), 0)';
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className="bg-background text-foreground">
      {/* HERO (C: image + gradient + subtle motion) */}
      <section className="relative overflow-hidden">
        <div
          ref={heroRef}
          className="relative min-h-[92vh] flex items-center justify-center px-6 py-24"
        >
          {/* Background image (boardroom / enterprise) */}
          <Image
            src="/hero-boardroom.jpg"
            alt="Enterprise team collaborating with financial intelligence dashboards"
            fill
            className="object-cover opacity-25 dark:opacity-35"
            priority
          />

          {/* Optional secondary layer image for depth (very subtle) */}
          <Image
            src="/hero-team-mountain.jpg"
            alt="Leadership team alignment"
            fill
            className="object-cover opacity-0 dark:opacity-10"
            data-parallax-secondary=""
            style={{
              filter: 'blur(1px)',
            }}
          />

          {/* Theme-safe overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background/90 dark:from-background/70 dark:via-background/50 dark:to-background/80" />
          <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />
          <div className="absolute -bottom-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              ReconAI turns financial noise into defensible decisions
            </div>

            <h1 className="mt-6 text-5xl md:text-6xl font-extrabold tracking-tight">
              Financial intelligence
              <span className="block text-primary">you can defend</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground">
              Replace spreadsheets, guesswork, and fragmented tools with clear, auditable insight—built for operators
              who need clarity and confidence.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </SignedOut>

              <SignedIn>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-6 py-3 hover:bg-accent transition"
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </SignedIn>

              <Link
                href="/platform"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-foreground hover:bg-accent transition"
              >
                See the Platform <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                'Audit-ready architecture',
                'Security and controls by default',
                'Built to scale from solo to enterprise',
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-3 backdrop-blur"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-1 rounded-2xl overflow-hidden border border-border bg-background">
            <Image
              src="/security-lock.jpg"
              alt="Security and encryption"
              width={400}
              height={128}
              className="h-32 w-full object-cover opacity-90 dark:opacity-80"
            />
          </div>

          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Compliance-minded</div>
                <div className="text-muted-foreground">Controls + auditability baked in</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Secure by default</div>
                <div className="text-muted-foreground">Designed for sensitive financial data</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Defensible outputs</div>
                <div className="text-muted-foreground">Evidence you can stand behind</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT PROOF */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              See your business like a CFO—without becoming one
            </h2>
            <p className="mt-4 text-muted-foreground">
              ReconAI organizes transactions, highlights patterns, and delivers insight that&apos;s clear, consistent,
              and ready for serious review.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 font-medium">
                  <LineChart className="h-4 w-4 text-primary" />
                  Clear reporting
                </div>
                <div className="mt-1 text-muted-foreground">
                  Cash flow, performance, and risk signals in one place.
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Audit-ready trails
                </div>
                <div className="mt-1 text-muted-foreground">
                  Consistent classification and defensible records.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl overflow-hidden border border-border bg-card">
              <Image
                src="/product-dashboard-wide.jpg"
                alt="Modern financial intelligence dashboard"
                width={800}
                height={256}
                className="h-64 w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden border border-border bg-card">
                <Image
                  src="/product-dashboard-ui.jpg"
                  alt="Financial reporting interface"
                  width={400}
                  height={176}
                  className="h-44 w-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden border border-border bg-card">
                <Image
                  src="/product-charts-close.jpg"
                  alt="Charts and trend analysis"
                  width={400}
                  height={176}
                  className="h-44 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OPERATIONS / TAX CLARITY */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden border border-border bg-background">
            <Image
              src="/finance-tax-desk.jpg"
              alt="Organized finance and tax workspace"
              width={800}
              height={288}
              className="h-72 w-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
              From messy inputs to clean, reviewable outputs
            </h3>
            <p className="mt-4 text-muted-foreground">
              Whether it&apos;s tax time, compliance, or a lender review—ReconAI helps your financial story stay consistent,
              organized, and easy to defend.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                'Reduce manual cleanup and recategorization.',
                'Keep a consistent ledger narrative over time.',
                'Export-ready insights for stakeholders.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center rounded-3xl border border-border bg-card p-8 md:p-12 overflow-hidden">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
              Built for founders, operators, and teams that take finance seriously
            </h3>
            <p className="mt-4 text-muted-foreground">
              If your decisions need to stand up to scrutiny, ReconAI is built for you.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
                >
                  Start Now <ArrowRight className="h-4 w-4" />
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
                >
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </SignedIn>
              <Link
                href="/support"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
              >
                Talk to Us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl overflow-hidden border border-border bg-background">
              <Image
                src="/user-owner-laptop.jpg"
                alt="Founder working with confidence"
                width={600}
                height={176}
                className="h-44 w-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden border border-border bg-background">
              <Image
                src="/user-success.jpg"
                alt="Positive financial outcomes for small business owners"
                width={600}
                height={176}
                className="h-44 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
