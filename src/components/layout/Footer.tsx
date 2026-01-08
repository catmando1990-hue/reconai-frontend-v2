import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ReconAI
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
