import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * POST /api/intelligence/worker/tasks/[taskId]/action
 *
 * Perform action on a worker task (approve, dismiss, etc.)
 * Since backend may not be configured, this handles actions locally.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const { taskId } = await params;
    const body = await req.json();
    const action = body.action as string;

    if (!action || !["approve", "dismiss", "defer"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid action", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // For now, acknowledge the action without backend persistence
    // In production, this would update the task status in the database
    console.log(`[Worker Task Action] Task ${taskId}: ${action} by ${userId}`);

    return NextResponse.json(
      {
        ok: true,
        task_id: taskId,
        action,
        message: `Task ${action}d successfully`,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Worker Task Action] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to perform action", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
