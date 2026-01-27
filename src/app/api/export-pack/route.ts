import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/export-pack
 *
 * Requests a compliance export pack for the specified date range.
 *
 * Body:
 * - rangeStartISO: string
 * - rangeEndISO: string
 * - include: Array<"audit" | "evidence" | "policy">
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

    const body = await req.json().catch(() => null);
    if (!body?.rangeStartISO || !body?.rangeEndISO || !body?.include) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required fields: rangeStartISO, rangeEndISO, include",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    console.log(
      `[Export Pack] userId=${userId}, range=${body.rangeStartISO} to ${body.rangeEndISO}, include=${body.include.join(",")}, requestId=${requestId}`,
    );

    return NextResponse.json(
      {
        request_id: requestId,
        status: "queued",
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Export Pack] Unhandled error:", err);
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
