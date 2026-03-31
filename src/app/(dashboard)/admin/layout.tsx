import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { sessionClaims } = await auth();

  const metadata = sessionClaims?.metadata as
    | { role?: string }
    | null
    | undefined;
  const isAdmin =
    metadata?.role === "admin" || sessionClaims?.org_role === "org:admin";

  if (!isAdmin) {
    redirect("/home");
  }

  return <>{children}</>;
}
