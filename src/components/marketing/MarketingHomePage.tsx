"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  LineChart,
  FileText,
  Layers,
  Shield,
} from "lucide-react";
import { ComplianceShieldLoop } from "@/components/dashboard/ComplianceShieldLoop";

/**
 * MarketingHomePage — Content component for the home page.
 *
 * DESIGN DISCIPLINE: Authority Frame Hero
 * - Static foreground content in single control frame
 * - No dynamic kickers, no use-case toggles, no embedded video
 * - Single H1, single CTA, simplified proof strip
 * - Background preserved unchanged
 *
 * NOTE: This component is rendered INSIDE MarketingLayout which provides:
 * - MarketingShell (with header, background, and <main> wrapper)
 */
export function MarketingHomePage() {
  return (
    <>
      {/* ================================================================
          HERO SECTION — AUTHORITY FRAME DESIGN
          ================================================================
          Structure:
          1. Background layer (unchanged)
          2. Overlay gradient (normalized, z-10)
          3. Authority frame + proof strip (z-20)
          ================================================================ */}
      <section className="relative isolate overflow-hidden border-b border-border">
        {/* Background image - UNCHANGED from original */}
        <div className="absolute inset-0 -z-20">
          <Image
            src="/hero-boardroom.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-15 dark:opacity-25"
            aria-hidden="true"
          />
        </div>

        {/* Overlay gradient - NORMALIZED (z-10) */}
        <div
          className="absolute inset-0 z-10 bg-gradient-to-b from-background/20 via-background/40 to-background/80 pointer-events-none"
          aria-hidden="true"
        />

        {/* Foreground content container (z-20) */}
        <div className="relative z-20 flex min-h-[80dvh] items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto w-full max-w-3xl">
            {/* ============================================================
                AUTHORITY FRAME — Single container for all hero messaging
                ============================================================ */}
            <div className="rounded-2xl border border-border bg-card/85 backdrop-blur-md p-8 md:p-10">
              {/* Kicker - Static, non-interactive */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Financial System of Record
              </div>

              {/* Headline - Single H1 on page */}
              <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
                Structured financial data
                <span className="block text-primary">you can defend</span>
              </h1>

              {/* Description - Factual, non-promotional */}
              <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                ReconAI organizes transactions, surfaces patterns, and produces
                audit-ready outputs. Every result traces to source evidence.
                No silent actions. No inferred data.
              </p>

              {/* Primary CTA - Single button only */}
              <div className="mt-8">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Access Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* ============================================================
                PROOF STRIP — Below authority frame, still inside hero
                ============================================================ */}
            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <li className="flex items-center gap-3 rounded-xl border border-border bg-card/70 backdrop-blur px-4 py-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium">Audit-Ready</span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-border bg-card/70 backdrop-blur px-4 py-3">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium">Manual-First</span>
              </li>
              <li className="flex items-center gap-3 rounded-xl border border-border bg-card/70 backdrop-blur px-4 py-3">
                <Lock className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium">Encrypted</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* TRUST STRIP + PACKAGES SECTION - Combined with shared background */}
      <section className="relative overflow-hidden">
        {/* Background image covering both sections */}
        <Image
          src="/packages-hero-bg.jpg"
          alt=""
          fill
          className="object-cover object-center opacity-40 dark:opacity-50"
          aria-hidden="true"
        />
        {/* Smooth gradient transition from hero above + text readability */}
        <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/60 to-background/70 dark:from-background/85 dark:via-background/50 dark:to-background/60" />
        {/* Subtle top fade for seamless hero transition */}
        <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-background via-background/80 to-transparent" />

        {/* TRUST STRIP */}
        <div className="relative z-10 border-t border-border/50">
          <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-1">
              <ComplianceShieldLoop />
            </div>

            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card/90 backdrop-blur p-4">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="font-medium">Access controls</div>
                  <div className="text-muted-foreground">
                    Role-based permissions and audit logs
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card/90 backdrop-blur p-4">
                <Lock className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="font-medium">Encryption at rest</div>
                  <div className="text-muted-foreground">
                    Data encrypted in storage and transit
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card/90 backdrop-blur p-4">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="font-medium">Traceable outputs</div>
                  <div className="text-muted-foreground">
                    Reports link to source transactions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PACKAGES SECTION */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
                <Layers className="h-4 w-4 text-primary" />
                Packaging (no pricing)
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Core. Intelligence. CFO Mode.
              </h2>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                ReconAI organizes data in layers. Each layer adds structure
                without requiring the previous.
              </p>
            </div>
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              View packages <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {[
              {
                title: "Core",
                icon: FileText,
                desc: "Accounts, transactions, and standard reports.",
              },
              {
                title: "Intelligence",
                icon: Layers,
                desc: "Pattern detection, alerts, and classification suggestions.",
              },
              {
                title: "CFO Mode",
                icon: LineChart,
                desc: "Summaries, dashboards, and exportable reports.",
              },
            ].map(({ title, icon: Icon, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card/90 backdrop-blur p-6"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Icon className="h-5 w-5 text-primary" />
                  {title}
                </div>
                <div className="mt-2 text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT PROOF + FINAL CTA - Combined with shared background */}
      <section className="relative overflow-hidden">
        {/* Background image covering both sections */}
        <Image
          src="/cta-hero-bg.jpg"
          alt=""
          fill
          className="object-cover object-center opacity-30 dark:opacity-40"
          aria-hidden="true"
        />
        {/* Smooth gradient transition from packages section above */}
        <div className="absolute inset-0 bg-linear-to-b from-background via-background/70 to-background/80 dark:from-background dark:via-background/60 dark:to-background/70" />
        {/* Top fade for seamless transition */}
        <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-background via-background/80 to-transparent" />

        {/* PRODUCT PROOF */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center overflow-hidden">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Financial data, organized and exportable
              </h2>
              <p className="mt-4 text-muted-foreground">
                ReconAI categorizes transactions, surfaces patterns, and
                generates reports structured for review.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-border bg-card/90 backdrop-blur p-4">
                  <div className="flex items-center gap-2 font-medium">
                    <LineChart className="h-4 w-4 text-primary" />
                    Standard reports
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Cash flow, income/expense, and category breakdowns.
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card/90 backdrop-blur p-4">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Audit trail
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Classification history and source transaction links.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 min-w-0">
              <div className="relative rounded-2xl overflow-hidden border border-border bg-card h-40 sm:h-52 md:h-64">
                <Image
                  src="/product-dashboard-wide.jpg"
                  alt="Modern financial intelligence dashboard"
                  fill
                  className="object-cover dark:opacity-90"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card h-32 sm:h-40 md:h-44">
                  <Image
                    src="/product-dashboard-ui.jpg"
                    alt="Financial reporting interface"
                    fill
                    className="object-cover dark:opacity-90"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card h-32 sm:h-40 md:h-44">
                  <Image
                    src="/product-charts-close.jpg"
                    alt="Charts and trend analysis"
                    fill
                    className="object-cover dark:opacity-90"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className="relative z-10 border-t border-border/50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center rounded-3xl border border-border bg-card/90 backdrop-blur p-8 md:p-12 overflow-hidden">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                  For teams that need organized financial data
                </h3>
                <p className="mt-4 text-muted-foreground">
                  ReconAI structures transactions, generates reports, and
                  maintains audit trails.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
                  >
                    Start Now <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/support"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
                  >
                    Talk to Us <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 min-w-0">
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card h-32 sm:h-40 md:h-44">
                  <Image
                    src="/user-owner-laptop.jpg"
                    alt="Founder working with confidence"
                    fill
                    className="object-cover dark:opacity-85"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card h-32 sm:h-40 md:h-44">
                  <Image
                    src="/user-success.jpg"
                    alt="Positive financial outcomes for small business owners"
                    fill
                    className="object-cover dark:opacity-85"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY CTA REMOVED — Per design discipline requirements */}
    </>
  );
}
