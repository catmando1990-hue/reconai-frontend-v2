import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function assertAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionRole = (
    sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  )?.role;
  if (sessionRole === "admin") return null;

  const user = await currentUser();
  const userRole = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.role;
  if (userRole === "admin") return null;

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET() {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

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
