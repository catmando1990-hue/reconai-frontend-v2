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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ fixId: string }> },
) {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const { fixId } = await params;

  if (!API_URL) {
    return NextResponse.json(
      { error: "Backend API not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.action || !body.confirmation_code) {
      return NextResponse.json(
        { error: "Missing required fields: action and confirmation_code" },
        { status: 400 },
      );
    }

    const res = await fetch(`${API_URL}/api/admin/fixes/${fixId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: body.action,
        confirmation_code: body.confirmation_code,
        admin_notes: body.admin_notes || null,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Approve fix error:", error);
    return NextResponse.json(
      { error: "Failed to approve fix" },
      { status: 500 },
    );
  }
}
