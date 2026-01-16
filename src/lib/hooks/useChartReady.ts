import { useState, useEffect, useRef, RefObject } from "react";

/**
 * useChartReady - Hook to ensure chart container has valid dimensions before rendering
 *
 * Prevents Recharts "Invalid dimension" warnings (width:-1/height:-1) by:
 * 1. Waiting for client-side hydration
 * 2. Using ResizeObserver to detect when container has real dimensions
 * 3. Only returning ready=true when width > 0 && height > 0
 *
 * No polling/timers - uses native ResizeObserver for efficient measurement.
 *
 * @returns [ref, ready] - Attach ref to container div, render chart when ready=true
 */
export function useChartReady<T extends HTMLElement = HTMLDivElement>(): [
  RefObject<T | null>,
  boolean,
] {
  const ref = useRef<T | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Skip on server
    if (typeof window === "undefined") return;

    const element = ref.current;
    if (!element) return;

    // Check if already has valid dimensions
    const checkDimensions = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setReady(true);
        return true;
      }
      return false;
    };

    // Initial check
    if (checkDimensions()) return;

    // Use ResizeObserver to detect when dimensions become valid
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setReady(true);
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, ready];
}
