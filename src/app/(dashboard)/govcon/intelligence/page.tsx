"use client";

import { useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useGovconIntelligence } from "@/hooks/useGovconIntelligence";
import {
  getSeverityBgClass,
  formatConfidence,
  type IntelligenceSignal,
} from "@/lib/intelligence-types";
import { cn } from "@/lib/utils";

/**
 * GovCon Intelligence Page
 *
 * STRICT ISOLATION: This page MUST NOT import or reference
 * any non-GovCon intelligence code.
 *
 * Domain-specific intelligence for GovCon module:
 * - DCAA readiness signals
 * - Timekeeping anomalies
 * - Indirect rate drift
 * - Unallowable cost flags
 * - Audit trail integrity warnings
 */

function SignalCard({
  signal,
  onViewEvidence,
}: {
  signal: IntelligenceSignal;
  onViewEvidence: (signal: IntelligenceSignal) => void;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={cn("text-xs", getSeverityBgClass(signal.severity))}
              >
                {signal.severity}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatConfidence(signal.confidence)} confidence
              </Badge>
              {signal.category.includes("DCAA") && (
                <Badge
                  variant="outline"
                  className="text-xs bg-primary/10 text-primary"
                >
                  DCAA
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-foreground truncate">
              {signal.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {signal.description}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Category: {signal.category}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewEvidence(signal)}
            className="shrink-0"
          >
            <Eye className="h-4 w-4 mr-1" />
            Evidence
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceModal({
  signal,
  open,
  onOpenChange,
}: {
  signal: IntelligenceSignal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!signal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {signal.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", getSeverityBgClass(signal.severity))}
            >
              {signal.severity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatConfidence(signal.confidence)} confidence
            </Badge>
            {signal.category.includes("DCAA") && (
              <Badge
                variant="outline"
                className="text-xs bg-primary/10 text-primary"
              >
                DCAA Relevant
              </Badge>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">
              Description
            </h4>
            <p className="text-sm text-muted-foreground">
              {signal.description}
            </p>
          </div>

          {signal.evidence && Object.keys(signal.evidence).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">
                Evidence
              </h4>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(signal.evidence, null, 2)}
              </pre>
            </div>
          )}

          {signal.advisory_disclaimer && (
            <div className="bg-chart-4/10 border border-chart-4/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-chart-4 shrink-0 mt-0.5" />
                <p className="text-xs text-chart-4">
                  {signal.advisory_disclaimer}
                </p>
              </div>
            </div>
          )}

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                <strong>DCAA Compliance Notice:</strong> This is an AI-generated
                advisory signal for government contracting oversight. GovCon
                Intelligence signals relate to DCAA readiness, timekeeping,
                indirect rates, unallowable costs, and audit trail integrity.
                All signals require verification by qualified compliance
                personnel. Do not use as the sole basis for compliance
                decisions.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GovconIntelligencePage() {
  const {
    signals,
    loading,
    error,
    lastUpdated,
    refresh,
    showLowConfidence,
    setShowLowConfidence,
  } = useGovconIntelligence();

  const [selectedSignal, setSelectedSignal] =
    useState<IntelligenceSignal | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const handleViewEvidence = (signal: IntelligenceSignal) => {
    setSelectedSignal(signal);
    setEvidenceOpen(true);
  };

  return (
    <RouteShell
      title="GovCon Intelligence"
      subtitle="DCAA readiness signals and audit trail integrity"
      right={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void refresh()}
            disabled={loading}
            className="h-8 px-2"
          >
            <RefreshCw
              className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            <span className="ml-1.5 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      }
    >
      {/* DCAA Advisory Banner */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              GovCon Intelligence - DCAA Compliance Advisory
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Signals are generated by AI analysis of your government
              contracting data. Categories include: DCAA readiness, timekeeping
              anomalies, indirect rate drift, unallowable cost flags, and audit
              trail integrity warnings.{" "}
              <strong>
                All signals require verification by qualified compliance
                personnel.
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-low-confidence"
              checked={showLowConfidence}
              onCheckedChange={setShowLowConfidence}
            />
            <Label
              htmlFor="show-low-confidence"
              className="text-sm text-muted-foreground"
            >
              Show low confidence signals
            </Label>
          </div>
          {showLowConfidence && (
            <div className="flex items-center gap-1 text-xs text-chart-4">
              <AlertTriangle className="h-3 w-3" />
              Low confidence signals require additional verification
            </div>
          )}
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border bg-card animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && signals.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-chart-1 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Intelligence Signals
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              {showLowConfidence
                ? "No GovCon compliance signals found. Continue processing contracts and timekeeping data."
                : "No high-confidence signals found. Enable 'Show low confidence signals' or process more GovCon data."}
            </p>
            <Button variant="outline" onClick={() => void refresh()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Intelligence
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Signals List */}
      {!loading && signals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {signals.length} Signal{signals.length !== 1 ? "s" : ""} Found
            </h3>
          </div>
          {signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onViewEvidence={handleViewEvidence}
            />
          ))}
        </div>
      )}

      {/* Evidence Modal */}
      <EvidenceModal
        signal={selectedSignal}
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
      />
    </RouteShell>
  );
}
