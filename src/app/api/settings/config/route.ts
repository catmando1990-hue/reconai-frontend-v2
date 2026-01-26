import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * GET /api/settings/config
 *
 * Returns settings configuration for the authenticated user.
 * Constructs lifecycle response from Clerk user data.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          settings_version: "1",
          lifecycle: "failed",
          reason_code: "unauthorized",
          reason_message: "Not authenticated",
          generated_at: new Date().toISOString(),
          settings: null,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const user = await currentUser();
    const publicMetadata = (user?.publicMetadata || {}) as Record<
      string,
      unknown
    >;
    const tier = (publicMetadata.tier as string) || "free";

    // Construct settings from available data
    const settings = {
      as_of: new Date().toISOString(),
      user_id: userId,
      organization_id: orgId || null,
      tier: tier,
      features: {
        intelligence_enabled: true,
        govcon_enabled: tier === "enterprise" || tier === "pro",
        plaid_enabled: true,
        ai_diagnostics_enabled: publicMetadata.role === "admin",
      },
      policy_acknowledged_at:
        (publicMetadata.policy_acknowledged_at as string) || null,
    };

    return NextResponse.json(
      {
        settings_version: "1",
        lifecycle: "success",
        reason_code: null,
        reason_message: null,
        generated_at: new Date().toISOString(),
        settings: settings,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Settings config] Error:", err);
    return NextResponse.json(
      {
        settings_version: "1",
        lifecycle: "failed",
        reason_code: "unknown",
        reason_message: err instanceof Error ? err.message : "Unknown error",
        generated_at: new Date().toISOString(),
        settings: null,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
}
