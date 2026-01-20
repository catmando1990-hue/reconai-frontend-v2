"use client";

import Link from "next/link";
import {
  Clock,
  Send,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Button } from "@/components/ui/button";
import PolicyBanner from "@/components/policy/PolicyBanner";
import { ROUTES } from "@/lib/routes";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TimekeepingPage() {
  return (
    <RouteShell
      title="Timekeeping"
      subtitle="DCAA-compliant labor tracking with daily time entry"
      right={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled
            title="Export coming soon"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" disabled title="Submit coming soon">
            <Send className="mr-2 h-4 w-4" />
            Submit Timesheet
          </Button>
        </div>
      }
    >
      <PolicyBanner
        policy="accounting"
        message="Time must be recorded daily with 15-minute increments. Corrections require evidence and supervisory approval."
        context="govcon"
      />

      {/* Period Navigation */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed"
          disabled
          title="Navigation coming soon"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Week
        </button>
        <div className="text-center">
          <p className="font-medium">Current Period</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <StatusChip variant="muted">Draft</StatusChip>
            <span className="text-sm text-muted-foreground">0 hours</span>
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed"
          disabled
          title="Navigation coming soon"
        >
          Next Week
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Weekly Grid */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Weekly Time Entry"
            subtitle="Click a day to add or view entries"
            actions={
              <Button
                variant="secondary"
                size="sm"
                disabled
                title="Add entry coming soon"
              >
                <Clock className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            }
          >
            <div className="grid grid-cols-7 divide-x border rounded-lg overflow-hidden">
              {DAYS_OF_WEEK.map((day, idx) => (
                <div
                  key={day}
                  className="p-3 min-h-[120px] hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{day}</p>
                    <p className="text-sm font-medium">{15 + idx}</p>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-lg font-semibold text-muted-foreground">
                      0h
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <EmptyState
                icon={Clock}
                title="No time entries"
                description="Add time entries by clicking on a day above or using the Add Entry button."
              />
            </div>
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Hours Summary">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Hours
                </span>
                <span className="text-lg font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billable</span>
                <span className="text-lg font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contracts</span>
                <span className="text-lg font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Days Logged
                </span>
                <span className="text-lg font-semibold">0</span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Hours by Contract">
            <EmptyState
              icon={FileText}
              title="No contract hours"
              description="Time entries will be grouped by contract here."
            />
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href={ROUTES.GOVCON_CONTRACTS}
                className="block text-primary hover:underline"
              >
                View contracts
              </Link>
              <Link
                href={ROUTES.GOVCON_AUDIT}
                className="block text-primary hover:underline"
              >
                Timesheet audit trail
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
