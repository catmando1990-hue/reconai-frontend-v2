import Providers from "@/app/providers";
import { Footer } from "@/components/layout/Footer";
import { RouteBackgroundWrapper } from "@/components/layout/RouteBackgroundWrapper";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * BotID bot protection - gated behind explicit env flag
 * Only loads in production when NEXT_PUBLIC_ENABLE_BOT_PROTECTION === "true"
 * This prevents console errors from c.js in development and when disabled
 */
const enableBotProtection =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_ENABLE_BOT_PROTECTION === "true";

// Lazy import to avoid loading the script when disabled
const BotIdClientComponent = enableBotProtection
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("botid/client").BotIdClient
  : null;

// Define protected routes for BotID bot protection
const protectedRoutes = enableBotProtection
  ? [
      // Auth endpoints
      { path: "/api/auth/*", method: "POST" as const },
      // Plaid endpoints
      { path: "/api/plaid/*", method: "POST" as const },
      // Admin endpoints
      { path: "/api/admin/*", method: "POST" as const },
      { path: "/api/admin/*", method: "PUT" as const },
      { path: "/api/admin/*", method: "DELETE" as const },
      // Proxy export
      { path: "/api/proxy-export", method: "POST" as const },
    ]
  : [];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReconAI",
  description: "Financial intelligence for individuals to enterprise teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* BotID only renders when explicitly enabled via env flag */}
        {BotIdClientComponent && (
          <BotIdClientComponent protect={protectedRoutes} />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Providers>
            <RouteBackgroundWrapper>
              <div className="min-h-dvh">
                {children}
                <Footer />
              </div>
            </RouteBackgroundWrapper>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
