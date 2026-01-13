"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  FileText,
  Eye,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

/**
 * Phase 11:
 * Security / Compliance landing page.
 * - No fake certification claims.
 * - Focus on posture: auditability, controls, data handling, transparency.
 * - Light/Dark auto-switch compatible via semantic tokens.
 */
export default function SecurityPage() {
  return (
    <main className="bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative px-6 py-20">
          <div className="absolute inset-0">
            <Image
              src="/security-lock.jpg"
              alt="Security and encrypted data"
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-15 dark:opacity-25"
            />
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/75 to-background/95 dark:from-background/80 dark:via-background/60 dark:to-background/90" />

          <div className="relative mx-auto max-w-6xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Security &amp; Compliance
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
              Built for review, not vibes
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground text-lg">
              ReconAI generates structured outputs with audit trails and access
              controls. Reports link to source transactions.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/platform"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
              >
                See the Platform <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold tracking-tight">
          Security principles
        </h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          We focus on controls, auditability, and clear boundaries around how
          sensitive data is handled.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 font-semibold">
              <KeyRound className="h-5 w-5 text-primary" />
              Least privilege
            </div>
            <div className="mt-2 text-muted-foreground">
              Access is scoped to what&apos;s needed. Privilege should be
              earned, not assumed.
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 font-semibold">
              <Eye className="h-5 w-5 text-primary" />
              Traceability
            </div>
            <div className="mt-2 text-muted-foreground">
              Reports link to source transactions. Classification changes are
              logged with timestamps.
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="h-5 w-5 text-primary" />
              Secure by default
            </div>
            <div className="mt-2 text-muted-foreground">
              We design for sensitive financial contexts with controlled
              surfaces and intentional data handling.
            </div>
          </div>
        </div>
      </section>

      {/* AUDITABILITY */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Audit trail as a product feature
            </h2>
            <p className="mt-4 text-muted-foreground">
              Outputs link to source records. Classification history is logged.
              Reports export with metadata for review.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Consistent classification patterns over time.",
                "Outputs link to source transactions.",
                "Exports include audit metadata.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl overflow-hidden border border-border bg-background relative h-80">
            <Image
              src="/product-charts-close.jpg"
              alt="Trend analysis and reporting"
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover opacity-90 dark:opacity-85"
            />
          </div>
        </div>
      </section>

      {/* POLICY & DATA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold tracking-tight">
          Policy-minded outputs
        </h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          ReconAI is built to support organizations that care about policy,
          process, and consistency. We avoid vague &quot;AI magic&quot; and
          focus on repeatable logic you can review.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          {[
            {
              title: "Controlled workflows",
              icon: FileText,
              desc: "Structured categorization and reporting designed for repeatability.",
            },
            {
              title: "Clear boundaries",
              icon: Lock,
              desc: "We treat sensitive financial data as sensitive. No casual handling.",
            },
            {
              title: "Reviewable decisions",
              icon: Eye,
              desc: "Reports are meant to be checked, not blindly trusted.",
            },
          ].map(({ title, icon: Icon, desc }) => (
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
                Want a security briefing view?
              </h3>
              <p className="mt-4 text-muted-foreground">
                If you&apos;re evaluating ReconAI for a serious environment, we
                can walk through the platform and intended controls.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/support"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
                >
                  Talk to Us <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
                >
                  Back to Home <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border bg-card relative h-72">
              <Image
                src="/finance-tax-desk.jpg"
                alt="Controlled, reviewable operations"
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
