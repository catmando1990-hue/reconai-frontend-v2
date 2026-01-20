"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Privacy page — inherits header/background from MarketingLayout.
 * NO inline MarketingShell wrapper (layout provides it).
 */
export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p className="mt-4 text-muted-foreground">Last updated: January 2026</p>

      <div className="mt-10 space-y-8 text-foreground/90">
        <section>
          <h2 className="text-xl font-semibold mb-3">
            1. Information We Collect
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            ReconAI collects information you provide directly, including account
            details, financial data you upload for reconciliation, and usage
            information to improve our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            2. How We Use Your Information
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We use your information to provide and improve our reconciliation
            services, communicate with you about your account, and ensure the
            security of our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures including
            encryption, access controls, and regular security audits to protect
            your financial data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain your data only as long as necessary to provide our
            services and comply with legal obligations. You may request deletion
            of your data at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">
            5. Third-Party Services
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We may use third-party services for authentication, analytics, and
            infrastructure. These providers are bound by confidentiality
            agreements and data protection standards.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data.
            Contact us to exercise these rights or for any privacy-related
            inquiries.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy questions or concerns, please contact our team at
            support@reconaitechnology.com.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border flex gap-6">
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>
        <Link href="/disclaimers" className="text-primary hover:underline">
          Disclaimers
        </Link>
      </div>
    </div>
  );
}
