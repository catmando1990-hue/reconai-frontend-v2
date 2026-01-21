"use client";

interface DuplicateItemWarningProps {
  isDuplicate: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export function DuplicateItemWarning({
  isDuplicate,
  onContinue,
  onCancel,
}: DuplicateItemWarningProps) {
  if (!isDuplicate) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-3">
      <p className="text-xs text-amber-700 dark:text-amber-300">
        This bank appears to already be connected. Linking it again may result
        in duplicate transactions.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 inline-flex items-center justify-center rounded-lg border border-amber-500 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          Continue anyway
        </button>
      </div>
    </div>
  );
}
