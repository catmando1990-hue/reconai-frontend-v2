import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ClerkConditionalProvider } from '@/components/auth/ClerkConditionalProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

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
            <div className="min-h-screen">
              <Header />
              {children}
              <Footer />
            </div>
          </ThemeProvider>
        </ClerkConditionalProvider>
      </body>
    </html>
  );
}
