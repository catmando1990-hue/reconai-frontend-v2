"use client";

import { useState } from "react";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { Button } from "@/components/ui/button";

interface PreferencesData {
  landingPage: string;
  currencyFormat: string;
  dateFormat: string;
  theme: string;
}

interface PreferencesSectionProps {
  initialPreferences?: Partial<PreferencesData>;
  onSave: (preferences: PreferencesData) => Promise<void>;
}

export function PreferencesSection({
  initialPreferences,
  onSave,
}: PreferencesSectionProps) {
  const [preferences, setPreferences] = useState<PreferencesData>({
    landingPage: initialPreferences?.landingPage ?? "Overview",
    currencyFormat: initialPreferences?.currencyFormat ?? "USD",
    dateFormat: initialPreferences?.dateFormat ?? "MM/DD/YYYY",
    theme: initialPreferences?.theme ?? "System",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(preferences);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SecondaryPanel title="Preferences" className="bg-card">
      <div className="space-y-4 text-sm">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Dashboard Landing Page
          </label>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={preferences.landingPage}
            onChange={(e) =>
              setPreferences((p) => ({ ...p, landingPage: e.target.value }))
            }
          >
            <option value="Overview">Overview</option>
            <option value="Transactions">Transactions</option>
            <option value="Intelligence">Intelligence</option>
            <option value="CFO Dashboard">CFO Dashboard</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Currency Format
          </label>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={preferences.currencyFormat}
            onChange={(e) =>
              setPreferences((p) => ({ ...p, currencyFormat: e.target.value }))
            }
          >
            <option value="USD">USD ($1,234.56)</option>
            <option value="EUR">EUR (€1.234,56)</option>
            <option value="GBP">GBP (£1,234.56)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Date Format
          </label>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={preferences.dateFormat}
            onChange={(e) =>
              setPreferences((p) => ({ ...p, dateFormat: e.target.value }))
            }
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Theme
          </label>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={preferences.theme}
            onChange={(e) =>
              setPreferences((p) => ({ ...p, theme: e.target.value }))
            }
          >
            <option value="System">System</option>
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          {saved && <span className="text-xs text-primary">Saved!</span>}
        </div>
      </div>
    </SecondaryPanel>
  );
}
