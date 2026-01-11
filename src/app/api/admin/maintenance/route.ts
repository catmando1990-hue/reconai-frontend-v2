import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG!;
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN!;

async function assertAdmin() {
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.publicMetadata?.role === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const forbidden = await assertAdmin();
  if (forbidden) return forbidden;

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?key=maintenance_mode`,
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

  const body = (await req.json().catch(() => ({}))) as { enabled?: boolean };
  const enabled = Boolean(body.enabled);

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
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
