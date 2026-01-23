import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// =========================================================================
// UNIVERSAL SECURITY HEADERS (short, no truncation risk)
// CSP and X-Frame-Options are handled by middleware (route-specific)
// =========================================================================

const universalHeaders = [
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
  async headers() {
    return [
      // Video files
      {
        source: "/videos/(.*)",
        headers: [
          { key: "Content-Type", value: "video/mp4" },
          { key: "Accept-Ranges", value: "bytes" },
        ],
      },
      // All routes - universal headers only
      {
        source: "/(.*)",
        headers: universalHeaders,
      },
    ];
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
};

export default withBotId(nextConfig);
