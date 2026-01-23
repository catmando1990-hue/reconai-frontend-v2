import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// Content Security Policy directives - BASE (shared between public and dashboard)
// Plaid requirements from: https://plaid.com/docs/link/web/
const cspDirectivesBase = [
  "default-src 'self'",
  // Scripts: self + inline for Next.js + Clerk + Plaid (cdn.plaid.com) + Vercel
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.reconaitechnology.com https://challenges.cloudflare.com https://vercel.live https://cdn.plaid.com",
  // Workers: allow blob workers (Clerk uses blob: workers)
  "worker-src 'self' blob:",
  // Styles: self + inline for Tailwind and component libraries
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs + blob + trusted CDNs
  "img-src 'self' data: blob: https://*.clerk.dev https://*.clerk.accounts.dev https://img.clerk.com https://clerk.reconaitechnology.com https://*.vercel-storage.com https://*.public.blob.vercel-storage.com",
  // Fonts: self + data URIs
  "font-src 'self' data:",
  // Connect: API endpoints + Clerk + Plaid (production.plaid.com per docs) + analytics
  "connect-src 'self' https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.reconaitechnology.com https://reconai-backend.onrender.com https://api.reconai.com https://*.vercel-storage.com https://vercel.live wss://*.clerk.dev wss://clerk.reconaitechnology.com https://production.plaid.com https://cdn.plaid.com",
  // Media: self + Vercel Blob storage
  "media-src 'self' https://*.vercel-storage.com https://*.public.blob.vercel-storage.com blob:",
  // Frame: self + Clerk + Plaid (cdn.plaid.com per docs)
  "frame-src 'self' https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.reconaitechnology.com https://challenges.cloudflare.com https://cdn.plaid.com",
  // Form actions: self only
  "form-action 'self'",
  // Base URI: self only
  "base-uri 'self'",
  // Object: none (block plugins)
  "object-src 'none'",
  // Upgrade insecure requests in production
  "upgrade-insecure-requests",
];

// STRICT CSP for dashboard routes - frame-ancestors 'none' prevents all framing (clickjacking protection)
const cspDashboardStrict = [
  ...cspDirectivesBase,
  "frame-ancestors 'none'",
].join("; ");

// MODERATE CSP for public routes - frame-ancestors 'self' allows same-origin framing
const cspPublicModerate = [...cspDirectivesBase, "frame-ancestors 'self'"].join(
  "; ",
);

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
  async headers() {
    // Shared security headers (excluding CSP which differs by route)
    const sharedSecurityHeaders = [
      // HSTS: Enforce HTTPS for 2 years, include subdomains, preload
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        // Permissions-Policy: Plaid Link requires encrypted-media and accelerometer for SEON fingerprinting
        // Using * to allow these features for all origins including Plaid's iframe
        // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), encrypted-media=*, accelerometer=*",
      },
    ];

    return [
        // DASHBOARD ROUTES — STRICT CSP (frame-ancestors 'none')
        // These routes handle authenticated financial data and must prevent all framing
        {
          source:
            "/(dashboard|home|core|cfo|intelligence|govcon|settings|invoicing|connect-bank|customers|receipts|ar)(.*)",
          headers: [
            ...sharedSecurityHeaders,
            // X-Frame-Options DENY for legacy browser support
            { key: "X-Frame-Options", value: "DENY" },
            {
              key: "Content-Security-Policy",
              value: cspDashboardStrict,
            },
          ],
        },

      // PUBLIC ROUTES — MODERATE CSP (frame-ancestors 'self')
      // Marketing pages, auth pages, etc. - allow same-origin framing
      {
        source: "/:path*",
        headers: [
          ...sharedSecurityHeaders,
          // X-Frame-Options SAMEORIGIN for legacy browser support
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: cspPublicModerate,
          },
        ],
      },

      // Video assets - aggressive caching
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withBotId(nextConfig);
