import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Plaid Connection Status Contract:
 * - "unknown": Cannot determine status (default fail-closed state)
 * - "not_connected": No Plaid items exist for user
 * - "active": Healthy connection
 * - "login_required": Item needs re-auth
 * - "error": Item has error state
 *
 * Source of truth: Supabase `plaid_items` table.
 */
export type PlaidConnectionStatus =
  | "active"
  | "login_required"
  | "error"
  | "unknown"
  | "not_connected";

export interface PlaidStatusResponse {
  status: PlaidConnectionStatus;
  items_count: number | null;
  last_synced_at: string | null;
  has_items: boolean;
  environment: string | null;
  source: "supabase" | "unknown";
}

export async function GET(req: Request) {
  const incomingRequestId = req.headers.get("x-request-id");
  const requestId = incomingRequestId || crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Query plaid_items from Supabase
    const { data: items, error } = await supabase
      .from("plaid_items")
      .select("item_id, status, updated_at")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (error) {
      console.error("[Plaid status] Supabase error:", error);
      const failStatus: PlaidStatusResponse & { request_id: string } = {
        status: "unknown",
        items_count: null,
        last_synced_at: null,
        has_items: false,
        environment: process.env.PLAID_ENV || "sandbox",
        source: "unknown",
        request_id: requestId,
      };
      return NextResponse.json(failStatus, {
        headers: { "x-request-id": requestId },
      });
    }

    const hasItems = items && items.length > 0;

    // Determine overall status from items
    let status: PlaidConnectionStatus = "not_connected";
    if (hasItems) {
      const hasLoginRequired = items.some((i) => i.status === "login_required");
      const hasError = items.some((i) => i.status === "error");
      const hasActive = items.some(
        (i) => i.status === "active" || i.status === null,
      );

      if (hasLoginRequired) {
        status = "login_required";
      } else if (hasError) {
        status = "error";
      } else if (hasActive) {
        status = "active";
      } else {
        status = "unknown";
      }
    }

    // Find most recent update timestamp
    const timestamps = (items || [])
      .map((i) => i.updated_at)
      .filter((ts): ts is string => ts !== null && ts !== undefined);
    const lastSyncedAt =
      timestamps.length > 0 ? timestamps.sort().reverse()[0] : null;

    const plaidStatus: PlaidStatusResponse & { request_id: string } = {
      status,
      items_count: items?.length || 0,
      last_synced_at: lastSyncedAt,
      has_items: hasItems,
      environment: process.env.PLAID_ENV || "sandbox",
      source: "supabase",
      request_id: requestId,
    };

    return NextResponse.json(plaidStatus, {
      headers: { "x-request-id": requestId },
    });
  } catch (err) {
    console.error("[Plaid status] Unhandled error:", err);

    const errorStatus: PlaidStatusResponse & { request_id: string } = {
      status: "unknown",
      items_count: null,
      last_synced_at: null,
      has_items: false,
      environment: null,
      source: "unknown",
      request_id: requestId,
    };

    return NextResponse.json(errorStatus, {
      headers: { "x-request-id": requestId },
    });
  }
}
