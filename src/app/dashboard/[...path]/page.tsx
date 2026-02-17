import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

function mapDashboardPath(path: string[]): string {
  const [section, ...rest] = path;

  if (!section) return "/dashboard";

  // Keep settings under /dashboard/settings (there is a dedicated page).
  if (section === "settings") return "/dashboard/settings";

  // Workspace entry points.
  if (section === "home") return "/home";
  if (section === "connect-bank") return "/connect-bank";
  if (section === "ar") return "/ar";

  // Core
  if (section === "core") {
    if (rest.length === 0) return "/core/overview";
    if (rest[0] === "accounts") return "/accounts";
    if (rest[0] === "transactions") return "/core/transactions";
    if (rest[0] === "reports") return "/core/reports";
    if (rest[0] === "overview") return "/core/overview";
    return "/core/overview";
  }

  // Intelligence (legacy redirects to Core intelligence)
  if (section === "intelligence") {
    // Redirect old global intelligence routes to Core intelligence
    return "/core/intelligence";
  }

  // CFO
  if (section === "cfo") {
    if (rest.length === 0) return "/cfo/overview";
    if (rest[0] === "overview") return "/cfo/overview";
    if (rest[0] === "executive-summary") return "/cfo/executive-summary";
    if (rest[0] === "compliance") return "/cfo/compliance";
    return "/cfo/overview";
  }

  // Invoicing
  if (section === "invoicing") {
    if (rest.length === 0) return "/invoicing";
    return `/invoicing/${rest.join("/")}`;
  }

  // GovCon
  if (section === "govcon") {
    if (rest.length === 0) return "/govcon";
    return `/govcon/${rest.join("/")}`;
  }

  // If we don't recognize the mapping, bounce back to the main dashboard entry.
  return "/dashboard";
}

export default async function DashboardCatchAllPage({
  params,
}: {
  params: { path: string[] };
}) {
  const { userId } = await auth();

  const raw = params?.path ?? [];
  const target = mapDashboardPath(raw);

  if (!userId) {
    redirect(`/sign-in?redirect_url=/dashboard/${raw.join("/")}`);
  }

  redirect(target);
}
