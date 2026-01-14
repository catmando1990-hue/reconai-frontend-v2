import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function assertAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check session claims first
  const sessionRole = (
    sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  )?.role;
  if (sessionRole === "admin") return null;

  // Fallback: fetch user directly to check publicMetadata
  const user = await currentUser();
  const userRole = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.role;
  if (userRole === "admin") return null;

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const { type } = await params;

  // Validate diagnostic type
  const validTypes = ["health", "performance", "security", "bugs"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid diagnostic type: ${type}` },
      { status: 400 },
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { error: "Backend API not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));

    const { getAuth } = await auth();
    const token = await getAuth?.().getToken();

    const res = await fetch(`${API_URL}/api/admin/diagnose/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type,
        depth: body.depth || "standard",
        include_fixes: body.include_fixes ?? true,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Diagnostic ${type} error:`, error);
    return NextResponse.json(
      { error: "Failed to run diagnostic" },
      { status: 500 },
    );
  }
}
