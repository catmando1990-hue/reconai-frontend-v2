import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPlaidClient } from "@/lib/plaid";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const public_token = body?.public_token;

  if (!public_token || typeof public_token !== "string") {
    return NextResponse.json(
      { error: "Missing public_token" },
      { status: 400 },
    );
  }

  const plaid = getPlaidClient();

  const resp = await plaid.itemPublicTokenExchange({ public_token });
  const access_token = resp.data.access_token;
  const item_id = resp.data.item_id;

  // NOTE: In v1 we do not persist access tokens yet.
  // Next phase: store access_token + item_id in Supabase keyed by userId (Clerk).
  void access_token;

  return NextResponse.json({ item_id });
}
