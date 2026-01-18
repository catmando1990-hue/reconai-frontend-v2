"use client";

import { useFirstRunFlag } from "@/hooks/useFirstRunFlag";

/**
 * One-time, calm acknowledgement line.
 * No modal. No animation. No celebration.
 */
export default function FirstRunSystemBanner({
  message = "Your financial system is active.",
}: {
  message?: string;
}) {
  const isFirstRun = useFirstRunFlag();
  if (!isFirstRun) return null;

  return (
    <div className="mb-3">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
