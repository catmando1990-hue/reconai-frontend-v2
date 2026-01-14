"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Command, Search, Sparkles, Settings, HelpCircle } from "lucide-react";
import { CommandPaletteModal } from "./CommandPaletteModal";
import { useHotkeys } from "@/lib/useHotkeys";

/**
 * BUILD 21-23: Command Strip V2
 * Desktop-first command strip with Cmd/Ctrl+K hotkey support.
 * Provides quick access to command palette and common actions.
 * Only visible in authenticated dashboard areas.
 */
export function CommandStripV2() {
  const { user, isLoaded } = useUser();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openPalette = useCallback(() => {
    setPaletteOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
  }, []);

  // Register Cmd/Ctrl+K hotkey
  useHotkeys("mod+k", openPalette);

  if (!isLoaded || !user) return null;

  return (
    <>
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4">
          {/* Left: Command palette trigger */}
          <button
            type="button"
            onClick={openPalette}
            className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-card/80 hover:text-foreground transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search or command...</span>
            <kbd className="ml-2 hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openPalette}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card/80 hover:text-foreground transition-colors"
              aria-label="AI Intelligence"
              title="AI Intelligence"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={openPalette}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card/80 hover:text-foreground transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={openPalette}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-card/80 hover:text-foreground transition-colors"
              aria-label="Help"
              title="Help"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <CommandPaletteModal open={paletteOpen} onClose={closePalette} />
    </>
  );
}
