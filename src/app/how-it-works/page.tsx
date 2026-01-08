"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  Sparkles,
  LineChart,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileText,
} from "lucide-react";

function SectionTitle({
  kicker,
  title,
  desc,
}: {
  kicker: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
        <Sparkles className="h-4 w-4 text-primary" />
        {kicker}
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground text-lg">{desc}</p>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  desc,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </div>
      <p className="mt-2 text-muted-foreground">{desc}</p>
      <ul className="mt-6 space-y-3 text-sm">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImgBlock({
  src,
  alt,
  height = 340,
}: {
  src: string;
  alt: string;
  height?: number;
}) {
  return (
    <div
      className="rounded-3xl overflow-hidden border border-border bg-card relative"
      style={{ height }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 520px, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-background/35 via-transparent to-transparent" />
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative px-6 py-20">
          <div className="absolute inset-0">
            <Image
              src="/hero-boardroom.jpg"
              alt="ReconAI in serious review environments"
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-12 dark:opacity-22"
            />
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/75 to-background/95 dark:from-background/80 dark:via-background/60 dark:to-background/90" />

          <div className="relative mx-auto max-w-6xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              <Layers className="h-4 w-4 text-primary" />
              How ReconAI Works
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
              A system built for defensible financial intelligence
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground text-lg">
              ReconAI is not &quot;AI bookkeeping.&quot; It&apos;s an integrated
              system designed to turn messy financial inputs into clean,
              reviewable outputs—so decisions hold up under scrutiny.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/platform"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
              >
                See the Platform <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* THE FLOW */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionTitle
          kicker="The ReconAI system"
          title="Core → Intelligence → CFO Mode"
          desc="We build financial clarity in layers. Each layer strengthens defensibility without adding chaos or overhead."
        />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            icon={FileText}
            title="ReconAI Core"
            desc="Structured financial reality. Clean inputs. Consistent outputs."
            items={[
              "Accounts, transactions, vendors, customers",
              "Bills, invoices, aging and cash flow",
              "Consistent reporting you can review",
            ]}
          />
          <Card
            icon={Sparkles}
            title="ReconAI Intelligence"
            desc="Signals and support that reduce noise and surface what matters."
            items={[
              "AI Worker + alerting",
              "Patterns, anomalies, and trend signals",
              'Decision context (not "AI magic")',
            ]}
          />
          <Card
            icon={LineChart}
            title="ReconAI CFO Mode"
            desc="Executive-level clarity for decisions and review environments."
            items={[
              "Executive summaries and performance views",
              "Lender / stakeholder-ready narratives",
              "Defensible outputs built to be checked",
            ]}
          />
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Compliance is implied—by design
          </div>
          <p className="mt-2 text-muted-foreground">
            We don&apos;t bolt compliance on at the end. Defensibility is built
            into the way outputs are formed: traceability, consistency, and
            review-friendly reporting are foundational.
          </p>
        </div>
      </section>

      {/* VISUAL PROOF */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <SectionTitle
              kicker="Product proof"
              title="From messy inputs to clean, reviewable outputs"
              desc="ReconAI turns transaction streams into a financial story you can stand behind—especially when decisions get reviewed."
            />

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                {
                  title: "Traceability",
                  icon: ShieldCheck,
                  desc: "Clear relationships between inputs and outputs.",
                },
                {
                  title: "Control",
                  icon: Lock,
                  desc: "Designed for sensitive financial contexts.",
                },
              ].map(({ title, icon: Icon, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-background p-5"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon className="h-4 w-4 text-primary" />
                    {title}
                  </div>
                  <p className="mt-2 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <ImgBlock
              src="/product-dashboard-wide.jpg"
              alt="Dashboard overview"
              height={260}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImgBlock
                src="/product-charts-close.jpg"
                alt="Trends and reporting"
                height={210}
              />
              <ImgBlock
                src="/security-lock.jpg"
                alt="Security posture"
                height={210}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center overflow-hidden">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                Want to see ReconAI in action?
              </h3>
              <p className="mt-4 text-muted-foreground">
                Open the platform, explore the dashboards, and see how clarity
                builds from Core to CFO Mode.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/platform"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
                >
                  Explore Platform <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
                >
                  Back to Home <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden border border-border bg-background relative h-72">
              <Image
                src="/finance-tax-desk.jpg"
                alt="Clean, controlled financial operations"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover opacity-90 dark:opacity-85"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background/35 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
