import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ShellV2 } from "@/components/dashboard-v2";

/**
 * Admin Module Layout
 * Restricts access to admin users only, uses V2 shell
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { sessionClaims } = await auth();

  // Check for admin role in session claims
  const metadata = sessionClaims?.metadata as
    | { role?: string }
    | null
    | undefined;
  const isAdmin =
    metadata?.role === "admin" || sessionClaims?.org_role === "org:admin";

  if (!isAdmin) {
    redirect("/home");
  }

  return <ShellV2 module="admin">{children}</ShellV2>;
}
