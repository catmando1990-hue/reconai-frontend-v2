import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function assertAdminAndGetToken(): Promise<{ error: NextResponse } | { token: string }> {
  const { userId, sessionClaims, getToken } = await auth();

  if (!userId) {
    console.error("assertAdminAndGetToken: No userId found in auth()");
    return { error: NextResponse.json({ error: "Unauthorized", debug: "No userId" }, { status: 401 }) };
  }

  // Helper to check if role is admin
  const isAdminRole = (role: unknown): boolean =>
    role === "admin" || role === "org:admin";

  // Check session claims first
  const sessionRole = (
    sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  )?.role;
  if (isAdminRole(sessionRole)) {
    const token = await getToken();
    return { token: token || "" };
  }

  // Fallback: fetch user directly to check publicMetadata
  const user = await currentUser();
  const userRole = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.role;

  console.log("assertAdminAndGetToken debug:", {
    userId,
    sessionRole,
    userRole,
    userPublicMetadata: user?.publicMetadata,
    isAdminByUser: isAdminRole(userRole)
  });

  if (isAdminRole(userRole)) {
    const token = await getToken();
    return { token: token || "" };
  }

  console.error("assertAdminAndGetToken: User not admin", { sessionRole, userRole });
  return { error: NextResponse.json({
    error: "Forbidden",
    debug: "Not admin",
    sessionRole,
    userRole,
    userPublicMetadata: user?.publicMetadata,
    userId,
    isAdminCheck: isAdminRole(userRole)
  }, { status: 403 }) };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const authResult = await assertAdminAndGetToken();
  if ("error" in authResult) return authResult.error;

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

    const res = await fetch(`${API_URL}/api/admin/diagnose/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authResult.token}`,
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
