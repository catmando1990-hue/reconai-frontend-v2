import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Proxy to Render backend which has Plaid credentials configured
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

    const resp = await fetch(
      `${BACKEND_URL}/plaid/accounts?user_id=${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to fetch accounts" },
        { status: resp.status },
      );
    }

    // Return accounts from backend response
    return NextResponse.json({ accounts: data.accounts || [] });
  } catch (err: unknown) {
    console.error("Plaid accounts error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch accounts: " + message },
      { status: 500 },
    );
  }
}
