import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/retention
 *
 * Returns the data retention policy for the specified scope.
 *
 * Query params:
 * - scope: "audit" | "evidence" | "exports" (required)
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");

    if (!scope || !["audit", "evidence", "exports"].includes(scope)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid or missing scope parameter",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Return retention policy for the requested scope
    const policy = {
      days: 365,
      scope: scope as "audit" | "evidence" | "exports",
      updatedAtISO: new Date().toISOString(),
      request_id: requestId,
    };

    return NextResponse.json(policy, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err) {
    console.error("[Retention] Unhandled error:", err);
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
