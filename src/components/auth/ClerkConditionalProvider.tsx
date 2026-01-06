'use client';

import React, { Suspense } from 'react';

const ClerkProviderLazy = React.lazy(async () => {
  const mod = await import('@clerk/nextjs');
  return { default: mod.ClerkProvider };
});

export function ClerkConditionalProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <ClerkProviderLazy publishableKey={publishableKey}>{children}</ClerkProviderLazy>
    </Suspense>
  );
}
