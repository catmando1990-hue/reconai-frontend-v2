"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfidenceMeta } from "@/components/dashboard/ConfidenceMeta";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { useWorkerTasks } from "@/hooks/useWorkerTasks";
import { useApi } from "@/lib/useApi";
import {
  AI_DISCLAIMER,
  FORM_ASSISTANCE_DISCLAIMER,
} from "@/lib/legal/disclaimers";
import { DisclaimerNotice } from "@/components/legal/DisclaimerNotice";
import { severityFromConfidence } from "@/lib/scoring";
import { TierGate } from "@/components/legal/TierGate";
import { Bot, RefreshCw, Check, X, Loader2, Send, MessageSquare } from "lucide-react";
import { ROUTES } from "@/lib/routes";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export default function AiWorkerPage() {
  const { apiFetch } = useApi();
  const { data, isLoading, error, refetch } = useWorkerTasks();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionedTasks, setActionedTasks] = useState<Set<string>>(new Set());

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI finance assistant. I can help you with task management, transaction categorization, reconciliation, and more. How can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = useCallback(async () => {
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await apiFetch<{ ok: boolean; message: ChatMessage }>(
        "/api/intelligence/worker/chat",
        {
          method: "POST",
          body: JSON.stringify({ message }),
        },
      );
      if (res.ok && res.message) {
        setChatMessages((prev) => [...prev, res.message]);
      }
    } catch (e) {
      console.error("Chat error:", e);
      setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I encountered an error processing your message. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, apiFetch]);

  const handleAction = useCallback(
    async (taskId: string, action: "approve" | "dismiss") => {
      setActionLoading(taskId);
      try {
        await apiFetch(`/api/intelligence/worker/tasks/${taskId}/action`, {
          method: "POST",
          body: JSON.stringify({ action }),
        });
        setActionedTasks((prev) => new Set(prev).add(taskId));
      } catch (e) {
        console.error("Task action failed:", e);
      } finally {
        setActionLoading(null);
      }
    },
    [apiFetch],
  );

  return (
    <TierGate tier="intelligence" title="AI Worker">
      <RouteShell
        title="AI Worker"
        subtitle="Structured assistance for repeatable finance workflows. You approve every final outcome."
        right={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      >
        <div className="space-y-2">
          <DisclaimerNotice>{AI_DISCLAIMER}</DisclaimerNotice>
          <DisclaimerNotice>{FORM_ASSISTANCE_DISCLAIMER}</DisclaimerNotice>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* BACKGROUND NORMALIZATION: Intelligence is ADVISORY (no bg-background) */}
          {/* Main content uses bg-card, inner items use bg-muted */}
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Task Queue</h2>
                <p className="text-sm text-muted-foreground">
                  AI-assisted workflow tasks awaiting your approval
                </p>
              </div>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading tasks…</p>
              ) : error ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : data?.items?.length ? (
                <div className="space-y-4">
                  {data.items.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-lg border border-border bg-muted p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{t.title}</h3>
                            <SeverityBadge
                              severity={severityFromConfidence(t.confidence)}
                            />
                            <StatusChip variant="muted">{t.status}</StatusChip>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t.summary}
                          </p>
                          {/* HIERARCHY: Confidence prominent + freshness inline */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <ConfidenceMeta confidence={t.confidence} />
                            <span className="text-muted-foreground/60">•</span>
                            <span>
                              {t.created_at
                                ? new Date(t.created_at).toLocaleString()
                                : "Time unknown"}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          {!actionedTasks.has(t.id) ? (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => void handleAction(t.id, "approve")}
                                disabled={actionLoading === t.id}
                                className="gap-1.5"
                              >
                                {actionLoading === t.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleAction(t.id, "dismiss")}
                                disabled={actionLoading === t.id}
                                className="gap-1.5"
                              >
                                <X className="h-3.5 w-3.5" />
                                Dismiss
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-3 pt-3 border-t border-border/50 text-sm text-muted-foreground">
                              <Check className="inline h-4 w-4 text-emerald-500 mr-1" />
                              Action completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Bot}
                  title="No tasks queued"
                  description="As you connect data sources and enable workflows, tasks will appear here."
                />
              )}
            </div>

            {/* AI Chat Terminal */}
            <div className="mt-6 rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">AI Assistant</h2>
              </div>

              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto rounded-lg border border-border bg-muted/50 p-3 mb-3">
                <div className="space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted border border-border"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <div
                          className={`mt-1 text-xs ${
                            msg.role === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-lg bg-muted border border-border px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about tasks, categorization, reports..."
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={chatLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={chatLoading || !chatInput.trim()}
                  className="gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </form>
            </div>
          </div>

          {/* Secondary Panels */}
          <div className="space-y-4 lg:col-span-4">
            <SecondaryPanel title="Task Summary">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Tasks
                  </span>
                  {/* HIERARCHY: Intelligence uses font-medium (subordinate to CFO) */}
                  <span className="text-lg font-medium">
                    {data?.items?.length ?? "No data"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Queued</span>
                  {/* HIERARCHY: Intelligence uses font-medium (subordinate to CFO) */}
                  <span className="text-lg font-medium">
                    {data?.items
                      ? data.items.filter((t) => t.status === "queued").length
                      : "No data"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Complete
                  </span>
                  {/* HIERARCHY: Intelligence uses font-medium (subordinate to CFO) */}
                  <span className="text-lg font-medium">
                    {data?.items
                      ? data.items.filter((t) => t.status === "complete").length
                      : "No data"}
                  </span>
                </div>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="How AI Worker Works">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  AI Worker analyzes your data and prepares structured task
                  recommendations for common finance workflows.
                </p>
                <p>
                  Every task shows confidence scores and requires your explicit
                  approval before any action is taken.
                </p>
                <p>
                  High-confidence tasks (≥0.85) are ready for review. Lower
                  confidence tasks may need additional verification.
                </p>
              </div>
            </SecondaryPanel>

            <SecondaryPanel title="Quick Links" collapsible>
              <div className="space-y-2 text-sm">
                <Link
                  href={ROUTES.INTELLIGENCE_INSIGHTS}
                  className="block text-primary hover:underline"
                >
                  View insights
                </Link>
                <Link
                  href={ROUTES.INTELLIGENCE_ALERTS}
                  className="block text-primary hover:underline"
                >
                  View alerts
                </Link>
                <Link
                  href={ROUTES.SETTINGS}
                  className="block text-primary hover:underline"
                >
                  Configure workflows
                </Link>
              </div>
            </SecondaryPanel>
          </div>
        </div>
      </RouteShell>
    </TierGate>
  );
}
