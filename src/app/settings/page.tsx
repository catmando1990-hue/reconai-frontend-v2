import { redirect } from "next/navigation";

/**
 * Redirect /settings to /dashboard/settings
 * The main settings page lives within the dashboard route group
 */
export default function SettingsRedirect() {
  redirect("/dashboard/settings");
}
