import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

// EDGE_CONFIG is a full URL like: https://edge-config.vercel.com/ecfg_xxx?token=yyy
// Extract just the ID (ecfg_xxx) for the Vercel API
function getEdgeConfigId(): string {
  const edgeConfigUrl = process.env.EDGE_CONFIG || "";
  const match = edgeConfigUrl.match(/edge-config\.vercel\.com\/(ecfg_[a-z0-9]+)/);
  return match?.[1] || "";
}

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN!;

async function assertAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized", debug: "No userId from auth()" },
      { status: 401 },
    );
  }

  // Check session claims first (if publicMetadata is synced to token)
  const sessionRole = (
    sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  )?.role;
  if (sessionRole === "admin") {
    return null;
  }

  // Fallback: fetch user directly to check publicMetadata
  const user = await currentUser();
  const userRole = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.role;
  if (userRole === "admin") {
    return null;
  }

  return NextResponse.json(
    {
      error: "Forbidden",
      debug: { userId, sessionRole, userRole },
    },
    { status: 403 },
  );
}

export async function GET() {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const edgeConfigId = getEdgeConfigId();
  if (!edgeConfigId) {
    return NextResponse.json(
      { error: "Edge Config not configured", maintenance: false },
      { status: 200 },
    );
  }

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items?key=maintenance_mode`,
    {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Failed to fetch maintenance_mode", details: text },
      { status: 500 },
    );
  }

  const data = (await res.json()) as {
    items?: Array<{ key: string; value: unknown }>;
  };
  const item = data.items?.[0];
  return NextResponse.json({ maintenance: Boolean(item?.value) });
}

export async function POST(req: Request) {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const edgeConfigId = getEdgeConfigId();
  if (!edgeConfigId) {
    return NextResponse.json(
      { error: "Edge Config not configured" },
      { status: 500 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { enabled?: boolean };
  const enabled = Boolean(body.enabled);

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ key: "maintenance_mode", value: enabled }],
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Failed to update maintenance_mode", details: text },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, maintenance: enabled });
}
