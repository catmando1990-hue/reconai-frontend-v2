import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { getPlaidClient } from "@/lib/plaid";
import { CountryCode, Products } from "plaid";

/**
 * POST /api/plaid/create-link-token
 *
 * Creates a Plaid Link token for connecting a bank account.
 * Calls Plaid API directly (no backend proxy).
 *
 * Optional body:
 * - context: "personal" | "business" (default: "personal")
 *   Used to scope Plaid items to Core (personal) or CFO (business).
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    // Parse optional context from body
    let context: "personal" | "business" = "personal";
    try {
      const body = await req.json().catch(() => ({}));
      if (body.context === "business") {
        context = "business";
      }
    } catch {
      // Use default
    }

    const headersList = await headers();
    const host = headersList.get("host") || "www.reconaitechnology.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/plaid/oauth`;

    console.log(
      `[Plaid create-link-token] userId=${userId}, context=${context}, redirectUri=${redirectUri}, requestId=${requestId}`,
    );

    const plaid = getPlaidClient();

    const response = await plaid.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: "ReconAI",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      redirect_uri: redirectUri,
      webhook: process.env.PLAID_WEBHOOK_URL || undefined,
    });

    return NextResponse.json(
      {
        link_token: response.data.link_token,
        expiration: response.data.expiration,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err: unknown) {
    console.error("[Plaid create-link-token] Error:", err);

    // Extract Plaid error details if available
    const plaidError = err as {
      response?: {
        data?: {
          error_code?: string;
          error_message?: string;
        };
      };
    };
    const errorCode = plaidError.response?.data?.error_code || "PLAID_ERROR";
    const errorMessage =
      plaidError.response?.data?.error_message ||
      (err instanceof Error ? err.message : "Failed to create link token");

    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
