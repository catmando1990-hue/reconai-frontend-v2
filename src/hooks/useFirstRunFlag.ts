"use client";

import { useSyncExternalStore } from "react";

const KEY = "reconai:first_run_complete";

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.localStorage.getItem(KEY);
    if (!v) {
      window.localStorage.setItem(KEY, "1");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(): () => void {
  // localStorage doesn't emit events for same-tab writes, so this is a no-op
  // The flag is read once on mount and never changes
  return () => {};
}

export function useFirstRunFlag(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
