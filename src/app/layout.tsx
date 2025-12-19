
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppProvider from '@/components/AppProvider';
import { DynamicProvider } from '@/firebase/dynamic-provider';
import A2hsBanner from '@/components/A2hsBanner';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  applicationName: "GlassPro Manager",
  title: "GlassPro Manager",
  description: "Auto Glass Pro Management System",
  manifest: `/manifest.json?v=${Date.now()}`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GlassPro Manager",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0079C1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased">
        <DynamicProvider>
          <AppProvider>
            <AppShell>
              {children}
            </AppShell>
            <Toaster />
            <A2hsBanner />
          </AppProvider>
        </DynamicProvider>
      </body>
    </html>
  );
}
