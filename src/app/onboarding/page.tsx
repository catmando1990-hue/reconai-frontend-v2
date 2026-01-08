"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Phase 15:
 * - Light/Dark compatible (semantic tokens)
 * - Writes BOTH:
 *   publicMetadata.onboarded = true (preferred)
 *   unsafeMetadata.onboardingComplete = true (fallback/legacy)
 * - Redirects cleanly to /dashboard after completion
 */

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(
    () => termsAccepted && privacyAccepted && !saving,
    [termsAccepted, privacyAccepted, saving],
  );

  const completeOnboarding = async () => {
    if (!user) return;
    if (!termsAccepted || !privacyAccepted) return;

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      // Write unsafeMetadata (client-settable). publicMetadata requires server-side API.
      // The middleware checks both publicMetadata.onboarded AND unsafeMetadata.onboardingComplete.
      await user.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          onboardingComplete: true,
          onboardingCompleteAt: now,
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
        },
      });

      await user.reload();

      // Set cookie as fallback for middleware (unsafeMetadata isn't in JWT by default)
      setCookie("onboarding_complete", "true", 365);

      setCompleted(true);

      // Hard redirect to force fresh session check by middleware.
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 650);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Failed to complete onboarding. Please try again.";
      setError(message);
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center bg-background text-foreground px-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[92vh] bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
          <Sparkles className="h-4 w-4 text-primary" />
          One-time setup
        </div>

        <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
          Welcome to ReconAI
        </h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
          Before you enter the dashboard, confirm a few basics so your outputs
          remain defensible and review-ready.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border border-border bg-card p-6"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">Terms and privacy</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  ReconAI is designed for serious finance. These confirmations
                  help keep data handling and reporting consistent.
                </p>

                <div className="mt-5 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-border bg-background px-4 py-3 hover:bg-accent transition">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <div className="text-sm">
                      <div className="font-medium">I agree to the Terms</div>
                      <div className="text-muted-foreground">
                        Read:{" "}
                        <Link
                          className="text-primary hover:underline"
                          href="/terms"
                          target="_blank"
                        >
                          Terms of Service
                        </Link>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-border bg-background px-4 py-3 hover:bg-accent transition">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    />
                    <div className="text-sm">
                      <div className="font-medium">
                        I agree to the Privacy Policy
                      </div>
                      <div className="text-muted-foreground">
                        Read:{" "}
                        <Link
                          className="text-primary hover:underline"
                          href="/privacy"
                          target="_blank"
                        >
                          Privacy Policy
                        </Link>
                      </div>
                    </div>
                  </label>
                </div>

                {error ? (
                  <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="rounded-3xl border border-border bg-card p-6"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">What happens next</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  You&apos;ll land in the dashboard. From there, you can explore
                  Core, Intelligence, and CFO Mode—without losing the narrative
                  thread.
                </p>

                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <Link
                    href="/how-it-works"
                    className="rounded-xl border border-border px-4 py-2 hover:bg-accent transition"
                  >
                    How it works
                  </Link>
                  <Link
                    href="/packages"
                    className="rounded-xl border border-border px-4 py-2 hover:bg-accent transition"
                  >
                    Packages
                  </Link>
                  <Link
                    href="/security"
                    className="rounded-xl border border-border px-4 py-2 hover:bg-accent transition"
                  >
                    Security
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={completeOnboarding}
            disabled={!canContinue || completed}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 transition",
              canContinue && !completed
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            ].join(" ")}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {completed ? "Completed" : "Continue to dashboard"}
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
          >
            Back to home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
