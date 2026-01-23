import { NextResponse } from "next/server";

export async function GET() {
  const requestId = crypto.randomUUID();
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "API routes are working",
      request_id: requestId,
    },
    { headers: { "x-request-id": requestId } },
  );
}
