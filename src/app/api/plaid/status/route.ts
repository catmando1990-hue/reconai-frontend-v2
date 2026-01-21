import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Proxy to Render backend
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

/**
 * Plaid Connection Status Contract:
 * - "unknown": Cannot determine status (default fail-closed state)
 * - "not_connected": No Plaid items exist for user
 * - "active": Backend confirms healthy connection
 * - "login_required": Backend reports item needs re-auth
 * - "error": Backend reports error state
 *
 * P1 FIX: This endpoint now returns honest "unknown" status instead of
 * fabricating "healthy"/"disconnected" from unrelated hardening config.
 * The hardening endpoint only reports sync kill-switch state, NOT actual
 * connection status.
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
  source: "backend_items" | "backend_hardening" | "unknown";
}

export async function GET() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();

    // P1 FIX: Try to fetch actual Plaid items from the v2 API first
    // This provides real connection status, not fabricated values
    let itemsResponse: { items?: Array<{ status?: string; item_id?: string; last_synced_at?: string }> } | null = null;
    try {
      const itemsResp = await fetch(`${BACKEND_URL}/api/plaid/items`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (itemsResp.ok) {
        itemsResponse = await itemsResp.json();
      }
    } catch {
      // If items endpoint fails, continue with unknown status
    }

    // If we got items data, use it for real status
    if (itemsResponse?.items !== undefined) {
      const items = itemsResponse.items;
      const hasItems = items.length > 0;

      // Determine overall status from items
      let status: PlaidConnectionStatus = "not_connected";
      if (hasItems) {
        // Check if any item has an error or needs re-auth
        const hasLoginRequired = items.some((i) => i.status === "login_required");
        const hasError = items.some((i) => i.status === "error");
        const hasActive = items.some((i) => i.status === "active");

        if (hasLoginRequired) {
          status = "login_required";
        } else if (hasError) {
          status = "error";
        } else if (hasActive) {
          status = "active";
        } else {
          // Items exist but status unclear
          status = "unknown";
        }
      }

      // Find most recent sync timestamp
      const syncTimestamps = items
        .map((i) => i.last_synced_at)
        .filter((ts): ts is string => ts !== null && ts !== undefined);
      const lastSyncedAt = syncTimestamps.length > 0
        ? syncTimestamps.sort().reverse()[0]
        : null;

      const plaidStatus: PlaidStatusResponse = {
        status,
        items_count: items.length,
        last_synced_at: lastSyncedAt,
        has_items: hasItems,
        environment: process.env.PLAID_ENV || "sandbox",
        source: "backend_items",
      };

      return NextResponse.json(plaidStatus);
    }

    // Fallback: Try hardening endpoint, but DO NOT fabricate connection status
    try {
      const resp = await fetch(`${BACKEND_URL}/api/plaid/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (resp.ok) {
        // P1 FIX: Hardening endpoint only tells us if sync is enabled,
        // NOT whether the user has any bank connections. Return "unknown"
        // status to be honest about what we don't know.
        const plaidStatus: PlaidStatusResponse = {
          status: "unknown",
          items_count: null,
          last_synced_at: null,
          has_items: false, // We don't know - be conservative
          environment: process.env.PLAID_ENV || "sandbox",
          source: "backend_hardening",
        };

        return NextResponse.json(plaidStatus);
      }
    } catch {
      // Hardening endpoint also failed
    }

    // P1 FIX: If all backend calls fail, return honest "unknown" status
    // instead of fabricating a status
    const failClosedStatus: PlaidStatusResponse = {
      status: "unknown",
      items_count: null,
      last_synced_at: null,
      has_items: false,
      environment: null,
      source: "unknown",
    };

    return NextResponse.json(failClosedStatus);
  } catch (err: unknown) {
    console.error("Plaid status fetch error:", err);

    // P1 FIX: Even on error, return structured response with "unknown" status
    // instead of error object that frontend may misinterpret
    const errorStatus: PlaidStatusResponse = {
      status: "unknown",
      items_count: null,
      last_synced_at: null,
      has_items: false,
      environment: null,
      source: "unknown",
    };

    return NextResponse.json(errorStatus);
  }
}
