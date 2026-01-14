import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function assertAdminAndGetToken(): Promise<{ error: NextResponse } | { token: string }> {
  const { userId, sessionClaims, getToken } = await auth();

  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Helper to check if role is admin
  const isAdminRole = (role: unknown): boolean =>
    role === "admin" || role === "org:admin";

  const sessionRole = (
    sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  )?.role;
  if (isAdminRole(sessionRole)) {
    const token = await getToken();
    return { token: token || "" };
  }

  const user = await currentUser();
  const userRole = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.role;
  if (isAdminRole(userRole)) {
    const token = await getToken();
    return { token: token || "" };
  }

  return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

export async function GET() {
  const authResult = await assertAdminAndGetToken();
  if ("error" in authResult) return authResult.error;

  if (!API_URL) {
    return NextResponse.json(
      { error: "Backend API not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${API_URL}/api/admin/fixes/pending`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authResult.token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Get pending fixes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending fixes" },
      { status: 500 },
    );
  }
}
