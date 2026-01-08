"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  LineChart,
  FileText,
  Layers,
  Zap,
  Users,
  Building2,
} from "lucide-react";

const BUCKETS = [
  {
    title: "Core Financial Ops",
    desc: "Accounts, transactions, and reporting that stay consistent over time.",
    Icon: Layers,
    items: [
      "Accounts & bank connections",
      "Transaction classification",
      "Ledger & reporting",
    ],
  },
  {
    title: "Compliance & Defensibility",
    desc: "Controls and traceability designed for serious review environments.",
    Icon: ShieldCheck,
    items: [
      "Audit-friendly outputs",
      "Policy-backed categorization",
      "Security-first posture",
    ],
  },
  {
    title: "Operator Intelligence",
    desc: "Insight that supports decisions without adding overhead.",
    Icon: LineChart,
    items: [
      "Cash flow signals",
      "Pattern detection",
      "Executive-level summaries",
    ],
  },
];

export default function PlatformPage() {
  return (
    <main className="bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative px-6 py-20">
          <Image
            src="/product-dashboard-wide.jpg"
            alt="ReconAI dashboard overview"
            fill
            className="object-cover opacity-15 dark:opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/85 via-background/70 to-background/95 dark:from-background/75 dark:via-background/55 dark:to-background/90" />
          <div className="relative mx-auto max-w-6xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              <Zap className="h-4 w-4 text-primary" />
              Platform Overview
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
              A platform built for clarity, control, and defensibility
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground text-lg">
              ReconAI turns messy financial inputs into clean, reviewable
              outputs—so operators and teams can move with confidence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
              >
                How it works <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/packages"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
              >
                Packages <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-primary">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/security" className="hover:underline">
                Security
              </Link>
              <Link href="/support" className="hover:underline">
                Talk to Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SCREENSHOTS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Product proof</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Use the platform like a CFO: see performance, risk, and decisions
              clearly—without rebuilding your workflow.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            View Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border bg-card relative h-72">
            <Image
              src="/product-dashboard-wide.jpg"
              alt="Dashboard overview"
              fill
              sizes="(min-width: 1024px) 760px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-card relative h-72">
            <Image
              src="/security-lock.jpg"
              alt="Security"
              fill
              sizes="(min-width: 1024px) 360px, 100vw"
              className="object-cover opacity-90 dark:opacity-85"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden border border-border bg-card relative h-56">
            <Image
              src="/product-dashboard-ui.jpg"
              alt="UI detail"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-card relative h-56">
            <Image
              src="/product-charts-close.jpg"
              alt="Charts and trends"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* FEATURE BUCKETS */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold tracking-tight">
            What you can do with ReconAI
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            The platform is designed to scale from solo operators to enterprise
            teams—without losing clarity or control.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {BUCKETS.map(({ title, desc, Icon, items }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Icon className="h-5 w-5 text-primary" />
                  {title}
                </div>
                <div className="mt-2 text-muted-foreground">{desc}</div>
                <ul className="mt-6 space-y-3 text-sm">
                  {items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold tracking-tight">Who it&apos;s for</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          ReconAI is built for serious operators across business sizes and
          review environments.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          {[
            {
              title: "Solo operators",
              Icon: FileText,
              desc: "Replace chaos with consistent categorization and reporting.",
            },
            {
              title: "Growing SMBs",
              Icon: Users,
              desc: "Standardize outputs across teams and time periods.",
            },
            {
              title: "Enterprise & Gov",
              Icon: Building2,
              desc: "Controls and defensibility designed for scrutiny.",
            },
          ].map(({ title, Icon, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 font-semibold">
                <Icon className="h-5 w-5 text-primary" />
                {title}
              </div>
              <div className="mt-2 text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-border bg-background p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center overflow-hidden">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                Ready to see it live?
              </h3>
              <p className="mt-4 text-muted-foreground">
                Sign in and open your dashboard. If you need help, we&apos;ll
                guide you through setup.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/packages"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
                >
                  View packages <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-border bg-card relative h-72">
              <Image
                src="/finance-tax-desk.jpg"
                alt="Clean, reviewable financial operations"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
