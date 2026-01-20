"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Terms page — inherits header/background from MarketingLayout.
 * NO inline MarketingShell wrapper (layout provides it).
 */
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-4 text-muted-foreground">Last updated: January 2026</p>

      <div className="mt-10 space-y-8 text-foreground/90">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using ReconAI, you agree to be bound by these Terms
            of Service. If you do not agree to these terms, please do not use
            our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            2. Description of Service
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            ReconAI provides AI-powered financial reconciliation and analysis
            tools designed for finance professionals. Our platform helps
            automate matching, exception handling, and reporting workflows.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            3. User Responsibilities
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your
            account credentials, ensuring the accuracy of data you upload, and
            using the service in compliance with applicable laws and
            regulations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Ownership</h2>
          <p className="text-muted-foreground leading-relaxed">
            You retain ownership of all data you upload to ReconAI. We do not
            claim any ownership rights to your financial data or reconciliation
            outputs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            5. Service Availability
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We strive to maintain high availability but do not guarantee
            uninterrupted service. Scheduled maintenance and updates may
            occasionally affect access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            6. Limitation of Liability
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            ReconAI provides tools to assist with financial reconciliation but
            does not replace professional judgment. Users are responsible for
            verifying outputs and making final decisions on financial matters.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            Either party may terminate this agreement at any time. Upon
            termination, you may request export of your data within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these terms from time to time. Continued use of the
            service after changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border flex gap-6">
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        <Link href="/disclaimers" className="text-primary hover:underline">
          Disclaimers
        </Link>
      </div>
    </div>
  );
}
