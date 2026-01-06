import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-white text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} ReconAI</p>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-900">
            Home
          </Link>
          <Link href="/dashboard" className="text-xs text-zinc-600 hover:text-zinc-900">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
