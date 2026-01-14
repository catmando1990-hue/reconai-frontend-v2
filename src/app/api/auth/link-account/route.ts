import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://reconai-backend.onrender.com";

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  return NextResponse.json({
    route: "link-account",
    version: "v2",
    clerk_user_id: userId,
    email: user?.primaryEmailAddress?.emailAddress,
  });
}

export async function POST() {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken();
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "No email found for user" }, { status: 400 });
    }

    // Call backend to link Clerk ID to existing user
    const res = await fetch(`${API_URL}/api/auth/link-clerk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: user.primaryEmailAddress.emailAddress,
        clerk_user_id: userId,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Link account error:", error);
    return NextResponse.json(
      { error: "Failed to link account" },
      { status: 500 },
    );
  }
}
