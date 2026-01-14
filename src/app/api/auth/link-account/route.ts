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

    const email = user.primaryEmailAddress.emailAddress;
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";

    // First try to link existing user
    let res = await fetch(`${API_URL}/api/auth/link-clerk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: email,
        clerk_user_id: userId,
      }),
    });

    let data = await res.json();

    // If user not found, create via signup
    if (res.status === 404) {
      const slugBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
      const orgSlug = `${slugBase}-org`;

      res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          clerk_user_id: userId,
          first_name: firstName,
          last_name: lastName,
          organization_name: `${firstName || email.split("@")[0]}'s Organization`,
          organization_slug: orgSlug,
          tier: "individual",
        }),
      });

      data = await res.json();

      if (res.ok) {
        return NextResponse.json({
          success: true,
          message: "Account created successfully",
          action: "signup",
          ...data,
        });
      }
    }

    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: "Account linked successfully",
        action: "link",
        ...data,
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Link account error:", error);
    return NextResponse.json(
      { error: "Failed to link account" },
      { status: 500 },
    );
  }
}
