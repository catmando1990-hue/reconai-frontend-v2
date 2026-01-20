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
import { MarketingHeroShell } from "@/components/marketing/MarketingHeroShell";

const BUCKETS = [
  {
    title: "Core Financial Ops",
    desc: "Accounts, transactions, and reports in a single system.",
    Icon: Layers,
    items: [
      "Bank account connections",
      "Transaction categorization",
      "Standard financial reports",
    ],
  },
  {
    title: "Controls & Traceability",
    desc: "Audit logs, access controls, and linked source records.",
    Icon: ShieldCheck,
    items: [
      "Classification audit trail",
      "Role-based access",
      "Encryption at rest",
    ],
  },
  {
    title: "Analysis & Reporting",
    desc: "Pattern detection, alerts, and exportable summaries.",
    Icon: LineChart,
    items: ["Cash flow analysis", "Anomaly detection", "Exportable dashboards"],
  },
];

/**
 * Platform page — inherits header/background from MarketingLayout.
 * NO inline header or shell wrapper.
 */
export default function PlatformPage() {
  return (
    <>
      {/* HERO */}
      <MarketingHeroShell
        imageSrc="/product-dashboard-wide.jpg"
        imageAlt="ReconAI dashboard overview"
        kickerIcon={Zap}
        kickerText="Platform Overview"
        headline="Financial data, organized and exportable"
        description="ReconAI categorizes transactions, generates reports, and maintains audit trails in a single system."
        ctas={[
          { label: "Get Started", href: "/sign-in", variant: "primary" },
          {
            label: "How it works",
            href: "/how-it-works",
            variant: "secondary",
          },
          { label: "Packages", href: "/packages", variant: "secondary" },
        ]}
        navLinks={[
          { label: "Home", href: "/" },
          { label: "Security", href: "/security" },
          { label: "Talk to Us", href: "/support" },
        ]}
      />

      {/* SCREENSHOTS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Product overview
            </h2>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Dashboards display accounts, transactions, and reports. Data
              exports in standard formats.
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
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border bg-card relative h-48 sm:h-60 lg:h-72">
            <Image
              src="/product-dashboard-wide.jpg"
              alt="Dashboard overview"
              fill
              sizes="(min-width: 1024px) 760px, 100vw"
              className="object-cover dark:opacity-90"
            />
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-card relative h-48 sm:h-60 lg:h-72">
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
          <div className="rounded-2xl overflow-hidden border border-border bg-card relative h-40 sm:h-48 lg:h-56">
            <Image
              src="/product-dashboard-ui.jpg"
              alt="UI detail"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover dark:opacity-90"
            />
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-card relative h-40 sm:h-48 lg:h-56">
            <Image
              src="/product-charts-close.jpg"
              alt="Charts and trends"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover dark:opacity-90"
            />
          </div>
        </div>
      </section>

      {/* FEATURE BUCKETS */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <h2 className="text-3xl font-bold tracking-tight">
            Platform capabilities
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Scales from single-user to multi-team deployments. Same data
            structure at every tier.
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
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold tracking-tight">Who uses ReconAI</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Individuals, small businesses, and enterprise teams use the same
          underlying data structure.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          {[
            {
              title: "Solo operators",
              Icon: FileText,
              desc: "Categorizes transactions and generates standard reports.",
            },
            {
              title: "Growing SMBs",
              Icon: Users,
              desc: "Applies consistent classification across accounts.",
            },
            {
              title: "Enterprise & Gov",
              Icon: Building2,
              desc: "Adds access controls, audit logs, and custom exports.",
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="rounded-3xl border border-border bg-background p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center overflow-hidden">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                View the dashboard
              </h3>
              <p className="mt-4 text-muted-foreground">
                Sign in to access your data. Setup documentation is available in
                the help section.
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

            <div className="rounded-2xl overflow-hidden border border-border bg-card relative h-48 sm:h-60 lg:h-72">
              <Image
                src="/finance-tax-desk.jpg"
                alt="Clean, reviewable financial operations"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover dark:opacity-85"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
