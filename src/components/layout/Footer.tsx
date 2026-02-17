"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Public Site Footer — 2026 B2B SaaS / FinTech / GovTech Standard
 *
 * 4-column layout on desktop:
 * 1. Brand / Trust
 * 2. Product
 * 3. Company
 * 4. Legal & Compliance
 *
 * Rules:
 * - Token-only styling
 * - No hardcoded colors
 * - Light/dark parity
 * - Desktop-first, stacks on mobile
 * - No fake claims, no marketing hype
 * - All links verified to exist
 */
export function Footer() {
  const pathname = usePathname() || "/";

  // Hide footer on dashboard, onboarding, and auth routes
  const hiddenPrefixes = [
    "/dashboard",
    "/onboarding",
    "/sign-in",
    "/sign-up",
    "/home",
    "/core",
    "/govcon",
    "/payroll",
    "/cfo",
    "/settings",
    "/accounts",
    "/connect-bank",
    "/bills",
    "/invoices",
    "/vendors",
    "/customers",
    "/transactions",
    "/cash-flow",
    "/financial-reports",
    "/certifications",
    "/compliance",
    "/dcaa",
    "/ar",
    "/invoicing",
    "/leases",
    "/properties",
    "/receipts",
    "/rent-collection",
    "/tenants",
    "/units",
    "/upload",
  ];

  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* 4-column grid: stacks on mobile */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand / Trust */}
          <div className="space-y-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              ReconAI
            </Link>
            <p className="text-sm text-muted-foreground">
              Financial intelligence for regulated businesses.
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} ReconAI Technology LLC
            </p>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Product</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/platform"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Platform
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                How It Works
              </Link>
              <Link
                href="/packages"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Packages
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Pricing
              </Link>
              <Link
                href="/security"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Security
              </Link>
            </nav>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Company</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/about"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="/support"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Support
              </Link>
              <Link
                href="/legal"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Legal
              </Link>
            </nav>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/disclaimers"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Disclaimers
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
