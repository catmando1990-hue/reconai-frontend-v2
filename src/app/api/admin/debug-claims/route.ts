import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const { userId, sessionClaims, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get full user data to check publicMetadata directly
  const user = await currentUser();
  const token = await getToken();

  // Extract roles from both sources
  const sessionRole = (sessionClaims?.publicMetadata as Record<string, unknown> | undefined)?.role;
  const userRole = (user?.publicMetadata as Record<string, unknown> | undefined)?.role;

  // Helper to check admin
  const isAdminRole = (role: unknown): boolean =>
    role === "admin" || role === "org:admin";

  // Return the full session claims for debugging
  return NextResponse.json({
    userId,
    // Full session claims (to see all available fields)
    sessionClaimsKeys: sessionClaims ? Object.keys(sessionClaims) : [],
    sessionClaims,
    publicMetadata: sessionClaims?.publicMetadata,
    role: sessionClaims?.publicMetadata?.role,
    // Also check org membership role
    orgRole: sessionClaims?.org_role,
    orgId: sessionClaims?.org_id,
    // User data
    userPublicMetadata: user?.publicMetadata,
    sessionRole,
    userRole,
    // Admin check result (now includes org:admin)
    isAdminBySession: isAdminRole(sessionRole),
    isAdminByUser: isAdminRole(userRole),
    isAdmin: isAdminRole(sessionRole) || isAdminRole(userRole),
    // Token info
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 30)}...` : null,
  });
}
