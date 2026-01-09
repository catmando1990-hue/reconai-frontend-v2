import React from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Effective date: {updated}
        </p>
      </header>

      <section className="prose prose-neutral max-w-none dark:prose-invert mt-8">
        {children}
      </section>
    </main>
  );
}
