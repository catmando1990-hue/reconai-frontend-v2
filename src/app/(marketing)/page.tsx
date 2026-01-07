import FeatureGrid from '@/components/marketing/FeatureGrid';
import ProductShowcase from '@/components/marketing/ProductShowcase';
import { auth } from '@clerk/nextjs/server';
import Image from 'next/image';

export default async function MarketingHome() {
  const { userId } = await auth();

  const primaryHref = userId ? '/dashboard' : '/sign-in';
  const primaryText = userId ? 'Go to Dashboard' : 'Sign In';
  const secondaryHref = userId ? '/dashboard/connect-bank' : '/sign-up';
  const secondaryText = userId ? 'Connect a Bank' : 'Create Account';

  return (
    <main className="w-full">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt="ReconAI financial intelligence"
          fill
          className="absolute inset-0 -z-20 object-cover"
          priority
        />

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/95 via-background/85 to-background/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              Financial Intelligence Platform
            </span>

            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Financial intelligence you can{' '}
              <span className="underline decoration-foreground/30 underline-offset-8">defend</span>.
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              ReconAI transforms raw bank data into structured, auditable financial outputs — giving
              individuals, businesses, and enterprises confidence in every decision.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <a
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-xl bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition"
              >
                {primaryText} →
              </a>
              <a
                href={secondaryHref}
                className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold hover:bg-accent transition"
              >
                {secondaryText}
              </a>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 text-xs text-muted-foreground">
              <span>• Bank & statement ingestion</span>
              <span>• Rule-based classification</span>
              <span>• Audit & compliance-ready exports</span>
              <span>• Scales from solo to enterprise</span>
            </div>
          </div>
        </div>
      </section>

      {/* Keep existing sections */}
      <FeatureGrid />
      <ProductShowcase />
    </main>
  );
}
