import { auth } from '@clerk/nextjs/server'
import { get, set } from '@vercel/edge-config'

export default async function AdminSettings() {
  const { sessionClaims } = auth()
  const role = sessionClaims?.publicMetadata?.role

  if (role !== 'admin') {
    return <p>Access denied</p>
  }

  const maintenance = await get<boolean>('maintenance_mode')

  async function toggle() {
    'use server'
    await set('maintenance_mode', !maintenance)
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Admin Settings</h1>
      <p className="mt-4">
        Maintenance Mode: <strong>{maintenance ? 'ON' : 'OFF'}</strong>
      </p>
      <form action={toggle}>
        <button className="mt-4 rounded bg-black px-4 py-2 text-white">
          Toggle Maintenance
        </button>
      </form>
    </main>
  )
}
