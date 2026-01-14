import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Proxy to Render backend which has Plaid credentials configured
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

export async function POST() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();

    const resp = await fetch(`${BACKEND_URL}/link-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to create link token" },
        { status: resp.status },
      );
    }

    return NextResponse.json({
      link_token: data.link_token,
      expiration: data.expiration,
    });
  } catch (err: unknown) {
    console.error("Plaid link token error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create link token: " + message },
      { status: 500 },
    );
  }
}
