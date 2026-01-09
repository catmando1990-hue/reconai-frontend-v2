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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Effective date: {updated}
        </p>
      </header>

      <section className="prose prose-sm prose-neutral max-w-none dark:prose-invert mt-8 sm:prose-base">
        {children}
      </section>
    </main>
  );
}
