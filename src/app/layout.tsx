import Providers from "@/app/providers";
import { Footer } from "@/components/layout/Footer";
import { RouteBackgroundWrapper } from "@/components/layout/RouteBackgroundWrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { BotIdClient } from "botid/client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Define protected routes for BotID bot protection
const protectedRoutes = [
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
];

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
        <BotIdClient protect={protectedRoutes} />
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
