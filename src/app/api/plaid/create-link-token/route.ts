import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

const ENDPOINT = "/api/plaid/create-link-token";

export async function POST() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const headersList = await headers();
    const host = headersList.get("host") || "www.reconaitechnology.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/plaid/oauth`;

    const resp = await fetch(`${BACKEND_URL}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        user_id: userId,
        redirect_uri: redirectUri,
      }),
    });

    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.error(
        `Plaid create-link-token: non-JSON response (${resp.status})`,
      );
      return NextResponse.json(
        { error: "Bank connection failed. Please retry." },
        { status: 502 },
      );
    }

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
    return NextResponse.json(
      { error: "Bank connection failed. Please retry." },
      { status: 500 },
    );
  }
}
