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
  Info,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import { useCfoIntelligence } from "@/hooks/useCfoIntelligence";
import {
  getSeverityBgClass,
  formatConfidence,
  type IntelligenceSignal,
} from "@/lib/intelligence-types";
import { cn } from "@/lib/utils";

/**
 * CFO Intelligence Page
 *
 * Domain-specific intelligence for CFO module:
 * - Runway risk / burn anomalies
 * - Forecast deviation
 * - Cash flow volatility flags
 * - Receivables/payables risk
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
            <TrendingDown className="h-5 w-5 text-primary" />
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
              <div className="bg-muted rounded-lg p-3 space-y-2">
                {Object.entries(signal.evidence).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium text-foreground">
                      {Array.isArray(value)
                        ? value.join(", ")
                        : typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                    </span>
                  </div>
                ))}
              </div>
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

          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This is an AI-generated advisory signal for executive oversight.
                CFO Intelligence signals relate to runway, forecast deviation,
                and cash flow analysis. Consult with your finance team before
                making strategic decisions.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CfoIntelligencePage() {
  const {
    signals,
    loading,
    error,
    lastUpdated,
    refresh,
    showLowConfidence,
    setShowLowConfidence,
  } = useCfoIntelligence();

  const [selectedSignal, setSelectedSignal] =
    useState<IntelligenceSignal | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const handleViewEvidence = (signal: IntelligenceSignal) => {
    setSelectedSignal(signal);
    setEvidenceOpen(true);
  };

  return (
    <RouteShell
      title="CFO Intelligence"
      subtitle="Runway risk, forecast deviation, and cash flow signals"
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
      {/* Advisory Banner */}
      <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              CFO Intelligence is Advisory Only
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Signals are generated by AI analysis of your financial data.
              Categories include: runway risk, burn anomalies, forecast
              deviation, cash flow volatility, and receivables/payables risk.
              These insights support but do not replace executive judgment.
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
              Low confidence signals may be unreliable
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
                ? "No CFO signals found. Financial data may need more history for meaningful analysis."
                : "No high-confidence signals found. Enable 'Show low confidence signals' or accumulate more financial data."}
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
