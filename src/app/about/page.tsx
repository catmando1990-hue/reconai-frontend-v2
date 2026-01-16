import Link from "next/link";
import {
  Shield,
  Eye,
  FileText,
  Users,
  Building2,
  Briefcase,
  Lock,
  CheckCircle2,
  ArrowRight,
  Scale,
  Layers,
  Clock,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing";

export default function AboutPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
            <Building2 className="h-4 w-4 text-primary" />
            About ReconAI
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Financial infrastructure
            <span className="block text-primary">built for evidence</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            ReconAI is a financial system-of-record platform that organizes,
            classifies, and structures financial data for individuals, small
            businesses, and enterprise teams.
          </p>
        </section>

        {/* What ReconAI Is */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">What ReconAI Is</h2>
          <p className="mt-4 text-muted-foreground">
            ReconAI provides structured financial intelligence. The platform
            connects to your accounts, categorizes transactions, detects
            patterns, and generates reports that link back to source data. Every
            output is traceable.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <FileText className="h-5 w-5 text-primary" />
              <div className="mt-3 font-medium">System of Record</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Single source of truth for financial transactions and
                classifications.
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <Eye className="h-5 w-5 text-primary" />
              <div className="mt-3 font-medium">Pattern Detection</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Surfaces anomalies, duplicates, and cost structures
                automatically.
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <Layers className="h-5 w-5 text-primary" />
              <div className="mt-3 font-medium">Structured Outputs</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Reports, exports, and summaries formatted for review and audit.
              </div>
            </div>
          </div>
        </section>

        {/* Who It is For */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">Who It is For</h2>
          <p className="mt-4 text-muted-foreground">
            ReconAI scales from individual users managing personal finances to
            enterprise teams requiring compliance documentation and audit
            trails.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
              <Briefcase className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">Individuals</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Personal finance organization
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Tax preparation support
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Spending pattern insights
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">Small Business</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Multi-account management
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Consistent categorization
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Bookkeeper-ready exports
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
              <Building2 className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">Enterprise</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Role-based access controls
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Audit trail documentation
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Compliance report generation
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* What It Replaces/Augments */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">
            What ReconAI Augments
          </h2>
          <p className="mt-4 text-muted-foreground">
            ReconAI does not replace your accountant or ERP. It provides the
            structured data layer that feeds into existing workflows.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <Scale className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-medium">Accounting & Bookkeeping</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Pre-classified transactions ready for import. Reduces manual
                  categorization time.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <Shield className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-medium">Compliance & Audit</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Traceable outputs with source links. Audit trail for every
                  classification decision.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <Eye className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-medium">Financial Intelligence</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Pattern detection and anomaly surfacing. Cost structure
                  visibility across accounts.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <Lock className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-medium">Access Control</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Role-based permissions. Separation of duties for sensitive
                  operations.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">Our Principles</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
              <h3 className="font-semibold">Trust Through Evidence</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every classification, every report, every output links back to
                source transactions. No black boxes. No unexplained decisions.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
              <h3 className="font-semibold">Manual-First Control</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Automated suggestions require human approval. No background
                operations modify your data without explicit action.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
              <h3 className="font-semibold">Explainability</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Classification confidence scores, pattern detection reasoning,
                and audit logs explain how the system reached its conclusions.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
              <h3 className="font-semibold">Progressive Disclosure</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start simple. Add complexity as needed. The platform scales from
                basic categorization to full compliance workflows.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">
            Security & Compliance Posture
          </h2>
          <p className="mt-4 text-muted-foreground">
            ReconAI is built with security fundamentals in place. We do not make
            compliance claims beyond what we can demonstrate.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur text-center">
              <Lock className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-3 font-medium">Encryption</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Data encrypted at rest and in transit
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur text-center">
              <Shield className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-3 font-medium">Access Controls</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Role-based permissions with audit logging
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur text-center">
              <FileText className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-3 font-medium">Audit Trail</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Complete history of data access and modifications
              </div>
            </div>
          </div>
        </section>

        {/* Operating Model */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">
            Roadmap & Operating Model
          </h2>
          <p className="mt-4 text-muted-foreground">
            ReconAI ships iteratively. We prioritize stability over feature
            velocity.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <Clock className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-medium">Current Focus</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Core transaction management, classification accuracy, and
                  export reliability.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <Layers className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-medium">Near-Term</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Enhanced pattern detection, additional integrations, and
                  expanded report templates.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
              <Building2 className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="font-medium">Enterprise Roadmap</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Advanced compliance modules, custom integrations, and
                  dedicated support tiers.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section className="mt-20">
          <div className="rounded-2xl border border-border bg-card/70 p-8 backdrop-blur text-center">
            <h2 className="text-2xl font-bold tracking-tight">Get Started</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Access your financial data with structured outputs and traceable
              classifications.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
              >
                Contact Support <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
