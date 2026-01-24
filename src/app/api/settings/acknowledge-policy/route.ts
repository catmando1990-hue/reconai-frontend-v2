import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * POST /api/settings/acknowledge-policy
 *
 * Records policy acknowledgement for the authenticated user.
 * Updates user's publicMetadata with timestamp.
 */
export async function POST() {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const clerk = await clerkClient();
    const timestamp = new Date().toISOString();

    // Update user's publicMetadata with policy acknowledgement timestamp
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        policy_acknowledged_at: timestamp,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        acknowledged_at: timestamp,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Settings acknowledge-policy] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
