import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Return the full session claims for debugging
  return NextResponse.json({
    userId,
    sessionClaims,
    publicMetadata: sessionClaims?.publicMetadata,
    role: sessionClaims?.publicMetadata?.role,
    // Also check org membership role
    orgRole: sessionClaims?.org_role,
    orgId: sessionClaims?.org_id,
  });
}
