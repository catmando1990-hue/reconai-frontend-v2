import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SettingsPage from "../../(dashboard)/settings/page";

export default async function DashboardSettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard/settings");
  }

  return <SettingsPage />;
}
