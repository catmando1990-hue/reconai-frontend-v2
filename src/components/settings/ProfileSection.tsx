"use client";

import { useState } from "react";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "reconai_profile_settings";

interface ProfileData {
  id?: string;
  name?: string;
  organizationName?: string;
  orgId?: string;
  role?: string;
  timezone?: string;
  currency?: string;
  fiscalYearStart?: string;
  lastLogin?: string;
  mfaEnabled?: boolean;
}

interface ProfileFormData {
  timezone: string;
  currency: string;
  fiscalYearStart: string;
}

function loadProfileSettings(): ProfileFormData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveProfileSettings(data: ProfileFormData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

interface ProfileSectionProps {
  profile: ProfileData | null;
  onProfileUpdate?: (data: Partial<ProfileData>) => Promise<void>;
}

export function ProfileSection({
  profile,
  onProfileUpdate,
}: ProfileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Use lazy initialization to load from localStorage on first render
  const [form, setForm] = useState<ProfileFormData>(() => {
    const saved = loadProfileSettings();
    return {
      timezone: saved?.timezone || profile?.timezone || "",
      currency: saved?.currency || profile?.currency || "",
      fiscalYearStart: saved?.fiscalYearStart || profile?.fiscalYearStart || "",
    };
  });

  const handleSave = async () => {
    setSaving(true);
    // Persist to localStorage
    saveProfileSettings(form);
    // Also call onProfileUpdate if provided (for future backend integration)
    if (onProfileUpdate) {
      await onProfileUpdate(form);
    }
    setSaving(false);
    setEditing(false);
  };

  return (
    <SecondaryPanel title="Profile" className="bg-card">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-muted-foreground">Name</label>
            <p className="font-medium">{profile?.name ?? "—"}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Organization
            </label>
            <p className="font-medium">{profile?.organizationName ?? "—"}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Role</label>
            <p className="font-medium">{profile?.role ?? "—"}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">User ID</label>
            <p className="font-mono text-xs">{profile?.id ?? "—"}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Timezone
              </label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
              >
                <option value="">Select timezone...</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Currency
              </label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
              >
                <option value="">Select currency...</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Fiscal Year Start
              </label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.fiscalYearStart}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fiscalYearStart: e.target.value }))
                }
              >
                <option value="">Select month...</option>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="July">July</option>
                <option value="October">October</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
              <div>
                <label className="text-xs text-muted-foreground">
                  Timezone
                </label>
                <p className="font-medium">{profile?.timezone ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Currency
                </label>
                <p className="font-medium">{profile?.currency ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Fiscal Year Start
                </label>
                <p className="font-medium">{profile?.fiscalYearStart ?? "—"}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </Button>
          </>
        )}
      </div>
    </SecondaryPanel>
  );
}
