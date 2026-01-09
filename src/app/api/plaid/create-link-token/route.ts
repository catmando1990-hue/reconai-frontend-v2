import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Products, CountryCode } from "plaid";
import { getPlaidClient, getPlaidWebhookUrl } from "@/lib/plaid";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plaid = getPlaidClient();
  const webhook = getPlaidWebhookUrl();

  const resp = await plaid.linkTokenCreate({
    user: {
      // Must not be PII; Clerk userId is suitable.
      client_user_id: userId,
    },
    client_name: "ReconAI",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
    ...(webhook ? { webhook } : {}),
  });

  return NextResponse.json({
    link_token: resp.data.link_token,
    expiration: resp.data.expiration,
  });
}
