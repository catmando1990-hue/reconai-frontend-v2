import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPlaidClient } from "@/lib/plaid";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

  // Persist to Supabase (server-only)
  const sb = supabaseAdmin();
  const { error } = await sb.from("plaid_items").upsert(
    {
      clerk_user_id: userId,
      item_id,
      access_token,
      status: "active",
    },
    { onConflict: "clerk_user_id,item_id" },
  );

  if (error) {
    // Never return access_token; keep error generic.
    return NextResponse.json(
      { error: "Failed to persist bank connection" },
      { status: 500 },
    );
  }

  // Return minimal metadata
  return NextResponse.json({ item_id });
}
