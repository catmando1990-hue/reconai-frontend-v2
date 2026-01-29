import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Admin Module Layout
 * Restricts access to admin users only
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
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

  return <div className="flex flex-col h-full">{children}</div>;
}
