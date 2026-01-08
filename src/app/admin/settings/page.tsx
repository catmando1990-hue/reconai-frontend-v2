import { auth } from "@clerk/nextjs/server";

async function getMaintenance() {
  const res = await fetch("/api/admin/maintenance", { cache: "no-store" });
  return res.json();
}

export default async function AdminSettings() {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.publicMetadata?.role;

  if (role !== "admin") {
    return <p>Access denied</p>;
  }

  const { maintenance } = await getMaintenance();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Admin Settings</h1>
      <p className="mt-4">
        Maintenance Mode: <strong>{maintenance ? "ON" : "OFF"}</strong>
      </p>
      <form action="/api/admin/maintenance" method="POST">
        <button className="mt-4 rounded bg-black px-4 py-2 text-white">
          Toggle Maintenance
        </button>
      </form>
    </main>
  );
}
