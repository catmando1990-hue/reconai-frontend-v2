import { useEffect, useCallback } from "react";

type HotkeyCallback = (event: KeyboardEvent) => void;

/**
 * BUILD 21-23: useHotkeys Hook
 * Registers keyboard shortcuts with support for modifier keys.
 *
 * Key format:
 * - "mod+k" - Cmd on Mac, Ctrl on Windows/Linux
 * - "ctrl+k" - Ctrl key explicitly
 * - "shift+k" - Shift + K
 * - "alt+k" - Alt/Option key
 * - Combinations: "mod+shift+p"
 *
 * @param hotkey - The hotkey string (e.g., "mod+k")
 * @param callback - Function to call when hotkey is pressed
 * @param enabled - Whether the hotkey is active (default: true)
 */
export function useHotkeys(
  hotkey: string,
  callback: HotkeyCallback,
  enabled: boolean = true,
): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const keys = hotkey.toLowerCase().split("+");
      const key = keys[keys.length - 1];
      const modifiers = keys.slice(0, -1);

      // Check if the pressed key matches
      const pressedKey = event.key.toLowerCase();
      if (pressedKey !== key && event.code.toLowerCase() !== `key${key}`) {
        return;
      }

      // Check modifiers
      const isMac =
        typeof navigator !== "undefined" &&
        navigator.platform.toLowerCase().includes("mac");

      const modifierChecks: Record<string, boolean> = {
        mod: isMac ? event.metaKey : event.ctrlKey,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      };

      // Verify all required modifiers are pressed
      const allModifiersPressed = modifiers.every(
        (mod) => modifierChecks[mod] === true,
      );

      // Verify no extra modifiers are pressed (except for the ones we expect)
      const unexpectedModifiers = ["ctrl", "shift", "alt", "meta"].filter(
        (mod) => {
          // Skip the mod check since it maps to ctrl or meta
          if (modifiers.includes("mod")) {
            if ((isMac && mod === "meta") || (!isMac && mod === "ctrl")) {
              return false;
            }
          }
          if (modifiers.includes(mod)) {
            return false;
          }
          return modifierChecks[mod];
        },
      );

      if (allModifiersPressed && unexpectedModifiers.length === 0) {
        event.preventDefault();
        event.stopPropagation();
        callback(event);
      }
    },
    [hotkey, callback, enabled],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Utility to format a hotkey for display
 * Returns platform-appropriate symbols
 */
export function formatHotkey(hotkey: string): string {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toLowerCase().includes("mac");

  const keys = hotkey.split("+");

  const symbols: Record<string, string> = isMac
    ? {
        mod: "⌘",
        ctrl: "⌃",
        shift: "⇧",
        alt: "⌥",
        meta: "⌘",
      }
    : {
        mod: "Ctrl",
        ctrl: "Ctrl",
        shift: "Shift",
        alt: "Alt",
        meta: "Win",
      };

  return keys
    .map((key) => symbols[key.toLowerCase()] ?? key.toUpperCase())
    .join(isMac ? "" : "+");
}
