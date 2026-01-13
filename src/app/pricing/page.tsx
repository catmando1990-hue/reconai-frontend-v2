import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Tier = {
  name: string;
  price: string;
  who: string;
  purpose: string;
  why: string;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    who: "Anyone evaluating the product",
    purpose: "View dashboards and sample reports.",
    why: "Evaluation access. No production data.",
  },
  {
    name: "Core",
    price: "$49 / month",
    who: "Individuals and solo operators",
    purpose: "Transaction categorization and standard reports.",
    why: "Single-user access with basic features.",
  },
  {
    name: "Pro",
    price: "$89 / month",
    who: "Small businesses and teams",
    purpose: "Multi-account support, vendor tracking, and custom reports.",
    why: "Adds team features and export options.",
  },
  {
    name: "Contractor / Compliance",
    price: "$119 / month",
    who: "Government contractors",
    purpose: "Cost structure templates and audit trail exports.",
    why: "Includes compliance-oriented report formats.",
  },
  {
    name: "Enterprise / CFO Intelligence",
    price: "Custom",
    who: "Multi-entity organizations",
    purpose: "Custom integrations, SSO, and dedicated support.",
    why: "Pricing varies by scope and requirements.",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Monthly subscription. Features scale by tier.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Save 15% with annual billing.
        </p>
      </header>

      <section className="space-y-8">
        {TIERS.map((t) => (
          <article key={t.name} className="border-t border-border pt-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-base font-medium">{t.name}</h2>
              <div className="text-sm font-medium">{t.price}</div>
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Who
                </div>
                <div className="mt-1 text-sm">{t.who}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Purpose
                </div>
                <div className="mt-1 text-sm">{t.purpose}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Why this price
                </div>
                <div className="mt-1 text-sm">{t.why}</div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <footer className="mt-12 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          Enterprise pricing is scoped based on complexity and support
          requirements.
        </p>
        <div className="mt-6">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </footer>
    </main>
  );
}
