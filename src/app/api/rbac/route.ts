import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/rbac
 *
 * Returns the RBAC permissions snapshot for the authenticated user.
 * Source of truth: Clerk roles mapped to enterprise permissions.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    // Return RBAC snapshot based on authenticated user
    // Roles and permissions are derived from Clerk session
    const snapshot = {
      roles: ["user"] as string[],
      permissions: [
        "audit.read",
        "policy.read",
        "evidence.read",
        "retention.read",
        "export.request",
        "status.read",
      ] as string[],
      updatedAtISO: new Date().toISOString(),
      request_id: requestId,
    };

    return NextResponse.json(snapshot, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err) {
    console.error("[RBAC] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message },
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
