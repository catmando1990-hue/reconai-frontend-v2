import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Disclaimers | ReconAI",
  description: "ReconAI Disclaimers - Important notices about our platform",
};

export default function DisclaimersPage() {
  return (
    <main className="min-h-[92vh] bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Disclaimers
        </h1>
        <p className="mt-4 text-muted-foreground">Last updated: January 2026</p>

        <div className="mt-10 space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">
              No Financial, Tax, or Legal Advice
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              ReconAI provides tools and information only. ReconAI does not
              provide accounting, tax, legal, or financial advice. Consult
              qualified professionals for advice specific to your situation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Compliance Disclaimer
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Use of ReconAI does not guarantee compliance with DCAA, FAR, SF
              1408, or any other regulatory standard. Compliance depends on user
              policies, controls, and execution. ReconAI provides tools that may
              support compliance efforts but does not certify or guarantee
              compliance outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">User Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users are responsible for the accuracy of data entered,
              classifications made, and actions taken based on platform outputs.
              All outputs should be reviewed by qualified personnel before use
              in financial reporting, tax filings, or regulatory submissions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">No Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              ReconAI is provided &quot;as is&quot; without warranties of any
              kind, express or implied. We do not warrant that the service will
              be uninterrupted, error-free, or meet any specific requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions may be directed to support@reconaitechnology.com.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex gap-6">
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
