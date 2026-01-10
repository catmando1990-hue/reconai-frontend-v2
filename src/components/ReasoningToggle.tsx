'use client';

type Mode = 'explain' | 'summarize' | 'silent' | 'adaptive';

export function ReasoningToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border p-3">
      <div className="text-sm font-medium">Reasoning</div>
      <select
        className="rounded-xl border bg-transparent px-3 py-2 text-sm"
        value={mode}
        onChange={(e) => setMode(e.target.value as Mode)}
      >
        <option value="adaptive">Adaptive</option>
        <option value="summarize">Summarize</option>
        <option value="explain">Explain</option>
        <option value="silent">Silent</option>
      </select>
      <div className="text-xs opacity-70">
        Adaptive = explain on risky stuff, summarize on routine.
      </div>
    </div>
  );
}
