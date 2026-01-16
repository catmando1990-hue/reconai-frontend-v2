import Link from "next/link";
import {
  Mail,
  MessageSquare,
  Clock,
  FileText,
  Shield,
  AlertTriangle,
  Bug,
  BookOpen,
  CreditCard,
  Download,
  Lock,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Users,
  Building2,
  Zap,
  ClipboardList,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing";

export default function SupportPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
          <HelpCircle className="h-4 w-4 text-primary" />
          Support Center
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Enterprise-grade support
          <span className="block text-primary">when you need it</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Documentation, ticketing, and direct support channels. Response
          times scale with your tier.
        </p>
      </section>

      {/* Primary Contact - Prominent Email */}
      <section className="mt-16">
        <div className="rounded-2xl border-2 border-primary/50 bg-card/80 p-8 backdrop-blur text-center">
          <Mail className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">
            Primary Support Email
          </h2>
          <a
            href="mailto:admin@reconaitechnology.com"
            className="mt-4 inline-block text-2xl font-semibold text-primary hover:underline"
          >
            admin@reconaitechnology.com
          </a>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            For all support inquiries, feature requests, and technical
            assistance.
          </p>
        </div>
      </section>

      {/* What to Include in Your Email */}
      <section className="mt-12">
        <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
          <div className="flex items-start gap-4">
            <ClipboardList className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">
                What to Include in Your Email
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Help us resolve your issue faster by including the following
                details:
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>Organization Name</strong> — Your company or
                    account name
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>Page / Feature</strong> — Which page or feature
                    you were using
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>Steps to Reproduce</strong> — What you did before
                    the issue occurred
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>Timestamp / Timezone</strong> — When the issue
                    occurred (e.g., 2024-01-15 3:45 PM EST)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <strong>Request ID</strong> — If shown in an error message
                    (e.g., <code className="text-xs bg-card/60 px-1.5 py-0.5 rounded">req_abc123...</code>)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight">Support Channels</h2>
        <p className="mt-4 text-muted-foreground">
          Multiple ways to get help based on urgency and complexity.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <Mail className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">Email Support</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Submit detailed requests with attachments. Best for
              non-urgent issues and documentation requests.
            </p>
            <a
              href="mailto:admin@reconaitechnology.com"
              className="mt-4 block text-sm font-medium text-primary hover:underline"
            >
              admin@reconaitechnology.com
            </a>
          </div>
          <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">In-App Support</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Access help directly from your dashboard. Context-aware
              assistance based on your current view.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Available in dashboard
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <Clock className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">Response Targets</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Response times vary by tier and issue severity. Critical
              issues receive priority handling.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              See SLA table below
            </div>
          </div>
        </div>
      </section>

      {/* SLAs by Tier */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight">
          Service Level Targets by Tier
        </h2>
        <p className="mt-4 text-muted-foreground">
          Response time targets are goals, not guarantees. Actual response
          times may vary based on volume and complexity.
        </p>
        <div className="mt-8 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card/70 backdrop-blur">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium">Tier</th>
                <th className="px-4 py-3 text-left font-medium">
                  Initial Response
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  Critical Issues
                </th>
                <th className="px-4 py-3 text-left font-medium">Channels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="bg-card/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Free / Starter
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  48 business hours
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  24 business hours
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  Email, In-App
                </td>
              </tr>
              <tr className="bg-card/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Pro
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  24 business hours
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  8 business hours
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  Email, In-App, Priority Queue
                </td>
              </tr>
              <tr className="bg-card/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Enterprise
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  8 business hours
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  4 business hours
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  All channels + Dedicated contact
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Business hours: Monday-Friday, 9am-6pm ET. Excludes US federal
          holidays. Critical issues include data access failures and billing
          errors.
        </p>
      </section>

      {/* Self-Serve Documentation */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight">Documentation</h2>
        <p className="mt-4 text-muted-foreground">
          Self-serve resources for common tasks and questions.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
            <BookOpen className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-medium">Getting Started</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Account setup, bank connections, and initial configuration.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
            <CreditCard className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-medium">Billing & Subscriptions</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Plan management, invoices, and payment methods.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
            <Download className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-medium">Exports & Reports</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Export formats, report generation, and data downloads.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
            <Shield className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-medium">Security & Access</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Permissions, role management, and security settings.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
            <AlertTriangle className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-medium">Troubleshooting</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Common issues, error messages, and resolution steps.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-border bg-card/70 p-5 backdrop-blur">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="font-medium">API Reference</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Integration documentation for developers.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight">
          Incident & Status
        </h2>
        <p className="mt-4 text-muted-foreground">
          Check system health and current incident status.
        </p>
        <div className="mt-8 rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="font-medium">All Systems Operational</div>
                <div className="text-sm text-muted-foreground">
                  No known issues at this time
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              className="text-sm text-primary hover:underline"
            >
              View System Status
            </Link>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="text-sm text-muted-foreground">
              During incidents, status updates are posted to the dashboard
              System Status panel. For critical outages, affected users
              receive email notifications.
            </div>
          </div>
        </div>
      </section>

      {/* Data & Privacy */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight">
          Data & Privacy in Support
        </h2>
        <p className="mt-4 text-muted-foreground">
          What support staff can and cannot access when helping you.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="font-semibold">Support Can Access</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Account metadata (email, plan tier, created date)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                System logs with request_id (for debugging)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Feature flags and entitlements
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Error history and audit trail
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <div className="flex items-center gap-2 text-red-500">
              <Lock className="h-5 w-5" />
              <h3 className="font-semibold">Support Cannot Access</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                Your financial transaction data
              </li>
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                Bank account credentials or tokens
              </li>
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                Classification details or reports
              </li>
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                Data from other organizations
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Report a Bug */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold tracking-tight">Report a Bug</h2>
        <p className="mt-4 text-muted-foreground">
          Help us resolve issues faster by including the right information.
        </p>
        <div className="mt-8 rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
          <div className="flex items-start gap-4">
            <Bug className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <h3 className="font-semibold">What to Include in Bug Reports</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs bg-card/60 px-2 py-0.5 rounded">
                    1
                  </span>
                  <span>
                    <strong>Request ID</strong> — Shown in error messages.
                    Looks like: <code className="text-xs">req_abc123...</code>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs bg-card/60 px-2 py-0.5 rounded">
                    2
                  </span>
                  <span>
                    <strong>Timestamp</strong> — When the issue occurred
                    (include timezone)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs bg-card/60 px-2 py-0.5 rounded">
                    3
                  </span>
                  <span>
                    <strong>Steps to reproduce</strong> — What you did before
                    the error appeared
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs bg-card/60 px-2 py-0.5 rounded">
                    4
                  </span>
                  <span>
                    <strong>Expected vs actual</strong> — What should have
                    happened vs what did happen
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs bg-card/60 px-2 py-0.5 rounded">
                    5
                  </span>
                  <span>
                    <strong>Screenshots</strong> — If applicable, with
                    sensitive data redacted
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="mt-20">
        <div className="rounded-2xl border border-border bg-card/70 p-8 backdrop-blur text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Need Assistance?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Our support team is ready to help with account issues, technical
            questions, and feature requests.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground hover:opacity-90 transition"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:admin@reconaitechnology.com"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 hover:bg-accent transition"
            >
              Email Support <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
      </div>
    </MarketingShell>
  );
}
