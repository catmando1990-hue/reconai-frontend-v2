"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Sparkles,
  LineChart,
  FileText,
  Users,
  Building2,
  Briefcase,
  Layers,
} from "lucide-react";
import { AIVideoPreview } from "./AIVideoPreview";
import { MarketingHeroShell } from "./MarketingHeroShell";
import { ComplianceShieldLoop } from "@/components/dashboard/ComplianceShieldLoop";

type UseCase = "solo" | "smb" | "enterprise";

const USE_CASES: Array<{
  id: UseCase;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
  subheadline: string;
}> = [
  {
    id: "solo",
    title: "Solo",
    subtitle: "Structured outputs",
    Icon: Briefcase,
    subheadline:
      "Categorizes transactions, generates reports, and organizes financial data in one place.",
  },
  {
    id: "smb",
    title: "Small Business",
    subtitle: "Consistent records",
    Icon: Users,
    subheadline:
      "Applies consistent classification across accounts. Outputs are structured for review.",
  },
  {
    id: "enterprise",
    title: "Enterprise",
    subtitle: "Traceable outputs",
    Icon: Building2,
    subheadline:
      "Surfaces cost structures, flags unclassified items, and generates audit-trail documentation.",
  },
];

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * MarketingHomePage — Content component for the home page.
 *
 * NOTE: This component is rendered INSIDE MarketingLayout which provides:
 * - MarketingShell (with header, background, and <main> wrapper)
 *
 * Therefore, this component does NOT wrap in its own <main> tag.
 * Content is rendered directly into the parent layout.
 */
export function MarketingHomePage() {
  const [useCase, setUseCase] = useState<UseCase>("smb");
  const [showSticky, setShowSticky] = useState(false);

  const uc = USE_CASES.find((u) => u.id === useCase)!;

  // Sticky CTA: show after scroll
  useEffect(() => {
    const onScroll = () => {
      setShowSticky(window.scrollY > 520);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* HERO */}
      <MarketingHeroShell
        variant="home"
        imageSrc="/hero-boardroom.jpg"
        imageAlt="Enterprise team collaborating with financial intelligence dashboards"
        kickerIcon={Sparkles}
        kickerText={uc.subtitle}
        headline="Structured financial data"
        headlineAccent="ready for review"
        description={uc.subheadline}
        ctas={[
          { label: "Get Started", href: "/sign-in", variant: "primary" },
          {
            label: "See the Platform",
            href: "/platform",
            variant: "secondary",
          },
        ]}
        navLinks={[
          { label: "How it works", href: "/how-it-works" },
          { label: "Packages", href: "/packages" },
          { label: "Security", href: "/security" },
        ]}
      >
        {/* Use-case toggle buttons */}
        <div className="mt-8 flex items-center justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
            {USE_CASES.map(({ id, title, subtitle, Icon }) => {
              const active = id === useCase;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setUseCase(id)}
                  className={cx(
                    "group flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card/60 hover:bg-accent",
                  )}
                  aria-pressed={active}
                >
                  <Icon
                    className={cx(
                      "h-4 w-4",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span
                    className={cx(
                      "font-medium",
                      active ? "text-foreground" : "text-foreground",
                    )}
                  >
                    {title}
                  </span>
                  <span className="hidden md:inline text-muted-foreground">
                    &bull; {subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Video Preview */}
        <div className="mt-8 flex justify-center">
          <AIVideoPreview />
        </div>

        {/* Proof strip */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            { k: "95%+", v: "Classification accuracy target" },
            { k: "<24h", v: "Typical setup time" },
            { k: "Audit", v: "Traceable outputs" },
          ].map((m) => (
            <div
              key={m.k}
              className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur"
            >
              <div className="text-2xl font-bold tracking-tight">{m.k}</div>
              <div className="mt-1 text-muted-foreground">{m.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            "Structured for audit review",
            "Access controls included",
            "Solo to enterprise scale",
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
      </MarketingHeroShell>

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
                icon: Sparkles,
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
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card h-32 sm:h-40 md:h-44">
                  <Image
                    src="/product-dashboard-ui.jpg"
                    alt="Financial reporting interface"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card h-32 sm:h-40 md:h-44">
                  <Image
                    src="/product-charts-close.jpg"
                    alt="Charts and trend analysis"
                    fill
                    className="object-cover"
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
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card h-32 sm:h-40 md:h-44">
                  <Image
                    src="/user-success.jpg"
                    alt="Positive financial outcomes for small business owners"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY CTA (tasteful) */}
      <div
        className={cx(
          "fixed inset-x-0 bottom-4 z-50 mx-auto max-w-3xl px-4 transition-all",
          showSticky
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none",
        )}
        aria-hidden={!showSticky}
      >
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="text-sm">
            <div className="font-medium">View the dashboard</div>
            <div className="text-muted-foreground">
              Sign in to access your data.
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/sign-in"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-primary-foreground hover:opacity-90 transition"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
