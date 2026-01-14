import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// Content Security Policy directives
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + inline for Next.js + Clerk + Plaid + Vercel analytics
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.reconaitechnology.com https://challenges.cloudflare.com https://vercel.live https://cdn.plaid.com",
  // Workers: allow blob workers (Clerk uses blob: workers)
  "worker-src 'self' blob:",
  // Styles: self + inline for Tailwind and component libraries
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs + blob + trusted CDNs
  "img-src 'self' data: blob: https://*.clerk.dev https://*.clerk.accounts.dev https://img.clerk.com https://clerk.reconaitechnology.com https://*.vercel-storage.com https://*.public.blob.vercel-storage.com",
  // Fonts: self + data URIs
  "font-src 'self' data:",
  // Connect: API endpoints + Clerk + Plaid + analytics
  "connect-src 'self' https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.reconaitechnology.com https://reconai-backend.onrender.com https://api.reconai.com https://*.vercel-storage.com https://vercel.live wss://*.clerk.dev wss://clerk.reconaitechnology.com https://*.plaid.com",
  // Media: self + Vercel Blob storage
  "media-src 'self' https://*.vercel-storage.com https://*.public.blob.vercel-storage.com blob:",
  // Frame: self + Clerk + Plaid for auth flows
  "frame-src 'self' https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.reconaitechnology.com https://challenges.cloudflare.com https://*.plaid.com",
  // Frame ancestors: prevent clickjacking
  "frame-ancestors 'self'",
  // Form actions: self only
  "form-action 'self'",
  // Base URI: self only
  "base-uri 'self'",
  // Object: none (block plugins)
  "object-src 'none'",
  // Upgrade insecure requests in production
  "upgrade-insecure-requests",
];

const cspHeader = cspDirectives.join("; ");

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // HSTS: Enforce HTTPS for 1 year, include subdomains
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), encrypted-media=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
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
