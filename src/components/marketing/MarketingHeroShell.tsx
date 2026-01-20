"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface HeroCTA {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

interface MarketingHeroShellProps {
  /** Background image source */
  imageSrc: string;
  /** Background image alt text (for accessibility) */
  imageAlt?: string;
  /** Kicker pill icon */
  kickerIcon: LucideIcon;
  /** Kicker pill text */
  kickerText: string;
  /** Main headline */
  headline: string;
  /** Optional second line of headline (renders as primary-colored span) */
  headlineAccent?: string;
  /** Subheadline description */
  description: string;
  /** CTAs - first should be primary, rest secondary. Max 1 primary enforced. */
  ctas?: HeroCTA[];
  /** Optional nav links below CTAs */
  navLinks?: Array<{ label: string; href: string }>;
  /** Children rendered below nav links (for custom content like use-case toggles) */
  children?: React.ReactNode;
  /** Whether this is the full-height home hero (92dvh) or standard (auto) */
  variant?: "home" | "standard";
}

/**
 * MarketingHeroShell - Single authoritative marketing hero component.
 *
 * Enforces:
 * - Token-only colors (no hardcoded hex)
 * - Isolation stacking context
 * - Decorative layers behind content (negative z-index)
 * - Hard hero exit boundary (border-b)
 * - 1 primary CTA maximum
 */
export function MarketingHeroShell({
  imageSrc,
  imageAlt = "",
  kickerIcon: KickerIcon,
  kickerText,
  headline,
  headlineAccent,
  description,
  ctas = [],
  navLinks = [],
  children,
  variant = "standard",
}: MarketingHeroShellProps) {
  // Enforce max 1 primary CTA - normalize so only first primary is kept
  const normalizedCtas = ctas.reduce<HeroCTA[]>((acc, cta) => {
    const hasPrimary = acc.some((c) => c.variant === "primary");
    if (cta.variant === "primary" && hasPrimary) {
      // Demote additional primaries to secondary
      acc.push({ ...cta, variant: "secondary" });
    } else {
      acc.push(cta);
    }
    return acc;
  }, []);

  const isHome = variant === "home";

  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      {/* Background image - z-[-2] */}
      <div className="absolute inset-0 -z-20">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-15 dark:opacity-25"
        />
      </div>

      {/* Gradient overlay - z-[-1] */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/90 via-background/75 to-background/95 dark:from-background/80 dark:via-background/60 dark:to-background/90" />

      {/* Content */}
      <div
        className={
          isHome
            ? "relative flex min-h-[92dvh] items-center justify-center px-4 py-16 sm:px-6 sm:py-24"
            : "relative px-6 py-20"
        }
      >
        <div
          className={
            isHome ? "mx-auto max-w-5xl text-center" : "mx-auto max-w-6xl"
          }
        >
          {/* Kicker pill */}
          <div
            className={
              isHome
                ? "inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur"
                : "inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur"
            }
          >
            <KickerIcon className="h-4 w-4 text-primary" />
            {kickerText}
          </div>

          {/* Headline */}
          <h1
            className={
              isHome
                ? "mt-6 text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight"
                : "mt-6 text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
            }
          >
            {headline}
            {headlineAccent && (
              <span className="block text-primary">{headlineAccent}</span>
            )}
          </h1>

          {/* Description */}
          <p
            className={
              isHome
                ? "mt-6 text-lg md:text-xl text-muted-foreground"
                : "mt-4 max-w-2xl text-muted-foreground text-lg"
            }
          >
            {description}
          </p>

          {/* CTAs */}
          {normalizedCtas.length > 0 && (
            <div
              className={
                isHome
                  ? "mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                  : "mt-8 flex flex-col sm:flex-row gap-3"
              }
            >
              {normalizedCtas.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className={
                    cta.variant === "primary"
                      ? "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
                      : "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
                  }
                >
                  {cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          )}

          {/* Nav links */}
          {navLinks.length > 0 && (
            <div
              className={
                isHome
                  ? "mt-6 flex flex-wrap items-center justify-center gap-4 text-sm"
                  : "mt-6 flex flex-wrap gap-4 text-sm text-primary"
              }
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isHome ? "text-primary hover:underline" : "hover:underline"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Custom children */}
          {children}
        </div>
      </div>
    </section>
  );
}
