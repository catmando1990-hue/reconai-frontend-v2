// components/PreviewBanner.tsx
// Step 15: Preview awareness banner for deploy runs

'use client';

import { useEffect, useState } from 'react';

interface DeployRun {
  id: string;
  status: string;
  commit_sha?: string;
  preview_url?: string;
  created_at?: string;
}

interface PreviewBannerProps {
  run?: DeployRun | null;
}

export function PreviewBanner({ run }: PreviewBannerProps) {
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    // Check if we're in a Vercel preview environment
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    setIsPreview(vercelEnv === 'preview');
  }, []);

  // Only show in preview environments
  if (!isPreview) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '8px 16px',
        background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        fontSize: '13px',
        fontWeight: 600,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <span style={{ opacity: 0.9 }}>Preview Mode</span>
      {run && (
        <>
          <span style={{ opacity: 0.6 }}>|</span>
          <span>Run {run.id?.slice(0, 8) || 'N/A'}</span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.2)',
            }}
          >
            {run.status || 'unknown'}
          </span>
        </>
      )}
      {!run && <span style={{ opacity: 0.7 }}>No active run</span>}
    </div>
  );
}

export default PreviewBanner;
