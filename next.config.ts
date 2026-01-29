import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// All security headers are handled by middleware.ts
// No edge config dependency - all headers applied at runtime

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
      // Legacy -dashboard suffix routes
      {
        source: "/core-dashboard",
        destination: "/core",
        permanent: true,
      },
      {
        source: "/cfo-dashboard",
        destination: "/cfo",
        permanent: true,
      },
      {
        source: "/intelligence-dashboard",
        destination: "/intelligence",
        permanent: true,
      },
      {
        source: "/payroll-dashboard",
        destination: "/payroll",
        permanent: true,
      },
      // Orphaned routes that should be nested
      {
        source: "/accounts",
        destination: "/core/accounts",
        permanent: true,
      },
      {
        source: "/transactions",
        destination: "/core/transactions",
        permanent: true,
      },
      {
        source: "/cash-flow",
        destination: "/cfo/cash-flow",
        permanent: true,
      },
      {
        source: "/financial-reports",
        destination: "/cfo/reports",
        permanent: true,
      },
      {
        source: "/compliance",
        destination: "/cfo/compliance",
        permanent: true,
      },
      {
        source: "/customers",
        destination: "/invoicing/customers",
        permanent: true,
      },
      {
        source: "/vendors",
        destination: "/invoicing/vendors",
        permanent: true,
      },
      // 308 redirects for legacy /dashboard/* routes to canonical route-group paths
      {
        source: "/dashboard",
        destination: "/home",
        permanent: true,
      },
      {
        source: "/dashboard/home",
        destination: "/home",
        permanent: true,
      },
      {
        source: "/dashboard/settings",
        destination: "/settings",
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
