import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Proxy to Render backend
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

export async function GET() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();

    const resp = await fetch(`${BACKEND_URL}/api/plaid/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to fetch Plaid status" },
        { status: resp.status },
      );
    }

    const data = await resp.json();

    // Transform backend response to match frontend PlaidData interface
    // Backend returns: { ok, hardening: {...}, message }
    // Frontend expects: { environment, institutions, lastSync, status }
    const plaidStatus = {
      environment: data.hardening?.sync_enabled ? "production" : "sandbox",
      institutions: [], // Would need separate endpoint to fetch linked institutions
      lastSync: undefined, // Not provided by current backend
      status: data.hardening?.sync_enabled ? "healthy" : "disconnected",
    };

    return NextResponse.json(plaidStatus);
  } catch (err: unknown) {
    console.error("Plaid status fetch error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch Plaid status: " + message },
      { status: 500 },
    );
  }
}
