import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Products, CountryCode } from "plaid";
import { getPlaidClient, getPlaidWebhookUrl } from "@/lib/plaid";

export async function POST() {
  try {
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
  } catch (err: unknown) {
    console.error("Plaid link token error:", err);

    // Check for Plaid-specific error
    const plaidError = err as {
      response?: { data?: { error_message?: string; error_code?: string } };
    };
    if (plaidError?.response?.data?.error_message) {
      return NextResponse.json(
        {
          error: plaidError.response.data.error_message,
          code: plaidError.response.data.error_code,
        },
        { status: 400 },
      );
    }

    // Check for missing env var error
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Missing env var")) {
      return NextResponse.json(
        { error: "Server configuration error: " + message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create link token" },
      { status: 500 },
    );
  }
}
