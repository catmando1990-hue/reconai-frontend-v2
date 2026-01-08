import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG!;
const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN!;

export async function GET() {
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?key=maintenance_mode`,
    {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    },
  );
  const data = await res.json();
  return NextResponse.json({ maintenance: data.value });
}

export async function POST() {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.publicMetadata?.role;

  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const getRes = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?key=maintenance_mode`,
    {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    },
  );
  const current = await getRes.json();

  await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ key: "maintenance_mode", value: !current.value }],
    }),
  });

  return NextResponse.redirect("/admin/settings");
}
