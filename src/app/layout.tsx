import { ClerkConditionalProvider } from '@/components/auth/ClerkConditionalProvider';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/components/theme-provider';
import Providers from '@/app/providers';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ReconAI',
  description: 'Financial intelligence for individuals to enterprise teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkConditionalProvider>
          <ThemeProvider>
            <Providers>
              <div className="min-h-screen">
                <Header />
                {children}
                <Footer />
              </div>
            </Providers>
          </ThemeProvider>
        </ClerkConditionalProvider>
      </body>
    </html>
  );
}
