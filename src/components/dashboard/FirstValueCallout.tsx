"use client";

/**
 * One insight + one next action.
 * Avoid menus, checklists, or multiple CTAs.
 */
export default function FirstValueCallout({
  title = "Initial insight",
  insight,
  actionLabel,
  onAction,
}: {
  title?: string;
  insight: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{insight}</p>

      <div className="mt-3">
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ring-1 ring-inset ring-border hover:bg-accent"
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
