import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/policy/acknowledge
 *
 * Records policy acknowledgement for the current user.
 * Currently stores in-memory only (no persistence).
 *
 * TODO: If persistence is needed, proxy to backend or use database.
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { policy, version, context } = body as {
      policy?: string;
      version?: string;
      context?: string;
    };

    // Log acknowledgement (no persistence yet)
    console.log(
      `[Policy] User ${userId} acknowledged policy=${policy} version=${version} context=${context}`,
    );

    return NextResponse.json(
      {
        ok: true,
        acknowledged: true,
        policy,
        version,
        timestamp: new Date().toISOString(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Policy acknowledge] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
