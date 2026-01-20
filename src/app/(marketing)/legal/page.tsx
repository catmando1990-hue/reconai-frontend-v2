"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Legal page — inherits header/background from MarketingLayout.
 * NO inline MarketingShell wrapper (layout provides it).
 */
export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <h1 className="text-3xl font-bold">Legal & Disclaimers</h1>
      <p className="mt-4 text-muted-foreground">
        This platform provides information, not professional advice.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-6 text-muted-foreground">
        <li>
          <strong>Bookkeeping:</strong> Informational only
        </li>
        <li>
          <strong>Accounting:</strong> Consult a licensed CPA
        </li>
        <li>
          <strong>Tax:</strong> Consult a CPA, EA, or tax attorney
        </li>
        <li>
          <strong>Legal:</strong> Consult a licensed attorney
        </li>
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">
        ReconAI is not a registered investment advisor, broker-dealer, or tax
        professional. All information provided is for informational purposes
        only.
      </p>

      <div className="mt-12 pt-8 border-t border-border flex gap-6">
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>
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
