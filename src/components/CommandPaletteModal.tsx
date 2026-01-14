"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  LayoutDashboard,
  Sparkles,
  Settings,
  CreditCard,
  FileText,
  TrendingUp,
  Shield,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
};

type CommandPaletteModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * BUILD 21-23: Command Palette Modal
 * Searchable command palette with keyboard navigation.
 * Supports filtering by label and keywords.
 */
export function CommandPaletteModal({
  open,
  onClose,
}: CommandPaletteModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose],
  );

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      description: "View your main dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      action: () => navigate("/dashboard"),
      keywords: ["home", "main", "overview"],
    },
    {
      id: "intelligence",
      label: "Intelligence Panel",
      description: "AI-powered insights and suggestions",
      icon: <Sparkles className="h-4 w-4" />,
      action: () => navigate("/dashboard/intelligence"),
      keywords: ["ai", "insights", "suggestions", "categorization"],
    },
    {
      id: "transactions",
      label: "Transactions",
      description: "View and manage transactions",
      icon: <CreditCard className="h-4 w-4" />,
      action: () => navigate("/dashboard/core/transactions"),
      keywords: ["payments", "history", "records"],
    },
    {
      id: "signals",
      label: "Signals",
      description: "Anomaly detection and alerts",
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => navigate("/dashboard/core/signals"),
      keywords: ["alerts", "anomalies", "duplicates"],
    },
    {
      id: "audit",
      label: "Audit Log",
      description: "View system audit trail",
      icon: <FileText className="h-4 w-4" />,
      action: () => navigate("/dashboard/core/audit"),
      keywords: ["logs", "history", "trail"],
    },
    {
      id: "compliance",
      label: "Compliance",
      description: "Compliance and policy status",
      icon: <Shield className="h-4 w-4" />,
      action: () => navigate("/dashboard/cfo/compliance"),
      keywords: ["policy", "rules", "regulations"],
    },
    {
      id: "settings",
      label: "Settings",
      description: "Account and app settings",
      icon: <Settings className="h-4 w-4" />,
      action: () => navigate("/dashboard/settings"),
      keywords: ["preferences", "account", "profile"],
    },
    {
      id: "help",
      label: "Help & Support",
      description: "Get help and documentation",
      icon: <HelpCircle className="h-4 w-4" />,
      action: () => navigate("/dashboard/settings/help"),
      keywords: ["support", "docs", "documentation", "faq"],
    },
  ];

  const filteredCommands = query
    ? commands.filter((cmd) => {
        const searchLower = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(searchLower) ||
          cmd.description?.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchLower))
        );
      })
    : commands;

  // Reset selection when query changes
  useEffect(() => {
    const resetIndex = () => setSelectedIndex(0);
    resetIndex();
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      const resetState = () => {
        setQuery("");
        setSelectedIndex(0);
      };
      resetState();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) cmd.action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, filteredCommands, selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close command palette"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-card/80 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No commands found for &quot;{query}&quot;
            </div>
          ) : (
            <ul role="listbox">
              {filteredCommands.map((cmd, idx) => (
                <li
                  key={cmd.id}
                  role="option"
                  aria-selected={idx === selectedIndex}
                >
                  <button
                    type="button"
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      idx === selectedIndex
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-card/80"
                    }`}
                  >
                    <span
                      className={
                        idx === selectedIndex
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {cmd.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{cmd.label}</div>
                      {cmd.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                    {idx === selectedIndex && (
                      <ArrowRight className="h-4 w-4 text-primary" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted/50 px-1">
              ↑↓
            </kbd>
            navigate
          </span>
          <span className="mx-2">·</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted/50 px-1">
              ↵
            </kbd>
            select
          </span>
          <span className="mx-2">·</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted/50 px-1">
              esc
            </kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
