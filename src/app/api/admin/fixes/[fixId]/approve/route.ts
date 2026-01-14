import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function assertAdminAndGetToken(): Promise<
  { error: NextResponse } | { token: string }
> {
  const { userId, sessionClaims, getToken } = await auth();

  if (!userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ fixId: string }> },
) {
  const authResult = await assertAdminAndGetToken();
  if ("error" in authResult) return authResult.error;

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
        Authorization: `Bearer ${authResult.token}`,
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
