import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// =========================================================================
// CSP CONFIGURATION
// =========================================================================

const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.dev",
    "https://clerk.reconaitechnology.com",
    "https://challenges.cloudflare.com",
    "https://vercel.live",
    "https://cdn.plaid.com",
  ],
  "worker-src": ["'self'", "blob:"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://*.clerk.dev",
    "https://*.clerk.accounts.dev",
    "https://img.clerk.com",
    "https://clerk.reconaitechnology.com",
    "https://*.vercel-storage.com",
    "https://*.public.blob.vercel-storage.com",
  ],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://*.clerk.dev",
    "https://*.clerk.accounts.dev",
    "https://clerk.reconaitechnology.com",
    "https://reconai-backend.onrender.com",
    "https://api.reconai.com",
    "https://*.vercel-storage.com",
    "https://vercel.live",
    "wss://*.clerk.dev",
    "wss://clerk.reconaitechnology.com",
    "https://production.plaid.com",
    "https://cdn.plaid.com",
  ],
  "media-src": [
    "'self'",
    "https://*.vercel-storage.com",
    "https://*.public.blob.vercel-storage.com",
    "blob:",
  ],
  "frame-src": [
    "'self'",
    "https://*.clerk.dev",
    "https://*.clerk.accounts.dev",
    "https://clerk.reconaitechnology.com",
    "https://challenges.cloudflare.com",
    "https://cdn.plaid.com",
  ],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
};

function buildCSP(frameAncestors: string): string {
  const directives = Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
  return `${directives}; upgrade-insecure-requests; frame-ancestors ${frameAncestors}`;
}

const CSP_STRICT = buildCSP("'none'");
const CSP_MODERATE = buildCSP("'self'");

// Shared security headers
const sharedSecurityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), encrypted-media=*, accelerometer=*",
  },
];

// Dashboard routes - strict (frame-ancestors 'none')
const dashboardHeaders = [
  ...sharedSecurityHeaders,
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: CSP_STRICT },
];

// Public routes - moderate (frame-ancestors 'self')
const publicHeaders = [
  ...sharedSecurityHeaders,
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: CSP_MODERATE },
];

// Dashboard route prefixes
const dashboardPrefixes = [
  "dashboard",
  "home",
  "core",
  "cfo",
  "intelligence",
  "govcon",
  "settings",
  "invoicing",
  "connect-bank",
  "customers",
  "receipts",
  "ar",
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Ensure local images in /public are served correctly
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/terms-of-service",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
      // 308 redirects for legacy /dashboard/* routes to canonical route-group paths
      {
        source: "/dashboard/home",
        destination: "/home",
        permanent: true,
      },
      {
        source: "/dashboard/core",
        destination: "/core/overview",
        permanent: true,
      },
      {
        source: "/dashboard/core/:path*",
        destination: "/core/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/intelligence",
        destination: "/intelligence/insights",
        permanent: true,
      },
      {
        source: "/dashboard/intelligence/:path*",
        destination: "/intelligence/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/cfo",
        destination: "/cfo/overview",
        permanent: true,
      },
      {
        source: "/dashboard/cfo/:path*",
        destination: "/cfo/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/invoicing",
        destination: "/invoicing",
        permanent: true,
      },
      {
        source: "/dashboard/invoicing/:path*",
        destination: "/invoicing/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/govcon",
        destination: "/govcon",
        permanent: true,
      },
      {
        source: "/dashboard/govcon/:path*",
        destination: "/govcon/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/ar",
        destination: "/ar",
        permanent: true,
      },
      {
        source: "/dashboard/connect-bank",
        destination: "/connect-bank",
        permanent: true,
      },
    ];
  },
  // =========================================================================
  // HEADERS - ORDER IS CRITICAL
  // Next.js: Later entries override earlier entries for conflicting header keys.
  // Therefore: Public catch-all FIRST, Dashboard specific LAST
  // =========================================================================
  async headers() {
    const headerRules = [];

    // 1. Video files
    headerRules.push({
      source: "/videos/(.*)",
      headers: [
        { key: "Content-Type", value: "video/mp4" },
        { key: "Accept-Ranges", value: "bytes" },
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ...publicHeaders,
      ],
    });

    // 2. Homepage (SAMEORIGIN)
    headerRules.push({
      source: "/",
      headers: publicHeaders,
    });

    // 3. Catch-all public routes (SAMEORIGIN) - FIRST so dashboard can override
    headerRules.push({
      source: "/:path*",
      headers: publicHeaders,
    });

    // 4. Dashboard routes (DENY) - LAST to override catch-all
    for (const prefix of dashboardPrefixes) {
      headerRules.push({
        source: `/${prefix}`,
        headers: dashboardHeaders,
      });
      headerRules.push({
        source: `/${prefix}/:path*`,
        headers: dashboardHeaders,
      });
    }

    return headerRules;
  },
};

export default withBotId(nextConfig);
