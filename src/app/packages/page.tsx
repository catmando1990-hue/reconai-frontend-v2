"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Sparkles,
  ShieldCheck,
  LineChart,
  FileText,
  CheckCircle2,
} from "lucide-react";

function Pill({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
      <Icon className="h-4 w-4 text-primary" />
      {text}
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  desc,
  bullets,
  ctaHref,
  ctaLabel,
  featured,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  bullets: string[];
  ctaHref: string;
  ctaLabel: string;
  featured?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-3xl border bg-card p-7",
        featured ? "border-primary/60 shadow-sm" : "border-border",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </div>
      <p className="mt-3 text-muted-foreground">{desc}</p>

      <ul className="mt-6 space-y-3 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href={ctaHref}
          className={[
            "inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 transition",
            featured
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "border border-border hover:bg-accent",
          ].join(" ")}
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <main className="bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative px-6 py-20">
          <div className="absolute inset-0">
            <Image
              src="/product-dashboard-wide.jpg"
              alt="ReconAI product overview"
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-12 dark:opacity-22"
            />
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/75 to-background/95 dark:from-background/80 dark:via-background/60 dark:to-background/90" />

          <div className="relative mx-auto max-w-6xl">
            <Pill icon={Layers} text="Packaging (No pricing shown)" />
            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
              Choose the layer of ReconAI you need
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground text-lg">
              ReconAI is built in layers. Start with Core, add Intelligence for
              pattern detection, and unlock CFO Mode for summary dashboards.
              Each layer adds structure to your financial data.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
              >
                See how it works <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/platform"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
              >
                Explore platform <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <Pill icon={Sparkles} text="Public packages" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Core → Intelligence → CFO Mode
            </h2>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              These packages describe capability layers—not price tiers.
              Features scale with each tier.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            title="ReconAI Core"
            icon={FileText}
            desc="Accounts, transactions, and standard reports in one system."
            bullets={[
              "Bank connections and transaction imports",
              "Bills, invoices, customers, vendors",
              "Standard reports (cash flow, aging, summaries)",
            ]}
            ctaHref="/sign-in"
            ctaLabel="Start with Core"
          />

          <Card
            title="ReconAI Intelligence"
            icon={Sparkles}
            desc="Pattern detection, alerts, and classification suggestions."
            bullets={[
              "Automated categorization",
              "Anomaly and trend detection",
              "Configurable alerts",
            ]}
            ctaHref="/platform"
            ctaLabel="See Intelligence in platform"
            featured
          />

          <Card
            title="ReconAI CFO Mode"
            icon={LineChart}
            desc="Summaries, dashboards, and exportable reports."
            bullets={[
              "Executive summary views",
              "Custom report exports",
              "Multi-period comparisons",
            ]}
            ctaHref="/how-it-works"
            ctaLabel="See the system flow"
          />
        </div>
      </section>

      {/* CONTROLS & TRACEABILITY */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <Pill icon={ShieldCheck} text="Controls & Traceability" />
            <h3 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">
              Audit trails and access controls included
            </h3>
            <p className="mt-4 text-muted-foreground">
              All outputs link to source records. Classification changes are
              logged with timestamps. Role-based access controls are available
              at higher tiers.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/security"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
              >
                Security &amp; posture <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
              >
                Talk to us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border border-border bg-background relative h-80">
            <Image
              src="/security-lock.jpg"
              alt="Security posture"
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover opacity-90 dark:opacity-85"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background/35 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* NAV */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="text-muted-foreground">
            ReconAI packaging (no pricing). Features scale by tier.
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/platform" className="hover:underline">
              Platform
            </Link>
            <Link href="/how-it-works" className="hover:underline">
              How it works
            </Link>
            <Link href="/security" className="hover:underline">
              Security
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
