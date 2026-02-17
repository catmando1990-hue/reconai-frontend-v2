"use client";

import { useState, useRef, useEffect } from "react";
import { useApi } from "@/lib/useApi";
import {
  CATEGORY_OPTIONS,
  type CategorySource,
  CATEGORY_SOURCE_LABELS,
} from "@/lib/categories";
import { ChevronDown, Sparkles, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CUSTOM_OPTION = "Custom...";

interface InlineCategoryEditorProps {
  transactionId: string;
  currentCategory: string | null;
  categorySource?: CategorySource;
  onCategoryChange?: (newCategory: string, newSource: CategorySource) => void;
  className?: string;
}

/**
 * Inline category editor for transaction ledger.
 * Click to open dropdown, select to save immediately.
 */
export function InlineCategoryEditor({
  transactionId,
  currentCategory,
  categorySource = "plaid",
  onCategoryChange,
  className,
}: InlineCategoryEditorProps) {
  const { auditedPatch } = useApi();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayCategory = currentCategory || "Uncategorized";

  // Focus input when entering custom mode
  useEffect(() => {
    if (isCustomMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCustomMode]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsCustomMode(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSave = async (category: string) => {
    if (!category.trim() || saving) return;

    setSaving(true);
    setError(null);

    try {
      await auditedPatch<
        { ok: boolean; category: string; category_source: CategorySource },
        { category: string; source: CategorySource }
      >(`/api/transactions/${transactionId}/category`, {
        category: category.trim(),
        source: "user",
      });

      // Notify parent of change (optimistic update already done by parent)
      onCategoryChange?.(category.trim(), "user");
      setIsOpen(false);
      setIsCustomMode(false);
      setCustomValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      // Error will show briefly then fade
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCategory = (cat: string) => {
    if (cat === CUSTOM_OPTION) {
      setIsCustomMode(true);
      setCustomValue(currentCategory || "");
    } else {
      void handleSave(cat);
    }
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      void handleSave(customValue);
    }
  };

  // Source indicator icon
  const SourceIcon =
    categorySource === "ai" ? Sparkles : categorySource === "rule" ? Bot : null;

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      {/* Display button */}
      <button
        type="button"
        onClick={() => !saving && setIsOpen(!isOpen)}
        disabled={saving}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs",
          "transition-colors hover:bg-muted/80",
          currentCategory ? "bg-muted" : "bg-muted/50 text-muted-foreground",
          saving && "opacity-50 cursor-wait",
          error && "ring-1 ring-destructive",
        )}
        title={
          categorySource !== "plaid" && categorySource !== "user"
            ? CATEGORY_SOURCE_LABELS[categorySource]
            : undefined
        }
      >
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : SourceIcon ? (
          <SourceIcon className="h-3 w-3 text-muted-foreground" />
        ) : null}
        <span className="max-w-24 truncate">{displayCategory}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg">
          {isCustomMode ? (
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Enter category..."
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCustomSubmit();
                  }
                  if (e.key === "Escape") {
                    setIsCustomMode(false);
                    setCustomValue("");
                  }
                }}
              />
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  disabled={!customValue.trim() || saving}
                  className="flex-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(false);
                    setCustomValue("");
                  }}
                  className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="max-h-60 overflow-auto py-1">
              {/* Custom option */}
              <button
                type="button"
                onClick={() => handleSelectCategory(CUSTOM_OPTION)}
                className="w-full px-3 py-1.5 text-left text-sm text-primary hover:bg-muted"
              >
                {CUSTOM_OPTION}
              </button>
              <div className="my-1 border-t border-border" />
              {/* Predefined categories */}
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-sm hover:bg-muted",
                    cat === currentCategory && "bg-muted font-medium",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute left-0 top-full z-50 mt-8 w-48 rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export type { InlineCategoryEditorProps };
