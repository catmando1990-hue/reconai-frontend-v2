'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import FeatureGrid from './FeatureGrid';
import ProductShowcase from './ProductShowcase';

export function MarketingHomePage() {
  return (
    <main className="bg-background text-foreground">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden">
        <Image
          src="/hero-enterprise.png"
          alt="ReconAI Enterprise Intelligence"
          fill
          className="object-cover opacity-20 dark:opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/70" />

        <div className="relative z-10 max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Financial intelligence
            <span className="block text-primary">you can defend</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground">
            Built for operators who need clarity, auditability, and confidence
            in every financial decision.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Trust & Credibility Strip */}
      <section className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 px-6 py-10 text-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Audit-ready architecture
          </div>
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-primary" />
            Secure by default
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Enterprise-grade compliance
          </div>
        </div>
      </section>

      {/* Existing sections */}
      <FeatureGrid />
      <ProductShowcase />
    </main>
  );
}
