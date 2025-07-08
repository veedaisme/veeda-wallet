import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { NetworkStatus } from "@/components/NetworkStatus";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Clair",
  description: "Track and analyze your spending habits",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Clair",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Clair",
    title: "Clair - Financial Tracker",
    description: "Track and analyze your spending habits",
  },
  twitter: {
    card: "summary",
    title: "Clair - Financial Tracker",
    description: "Track and analyze your spending habits",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Clair" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <QueryProvider>
          <NetworkStatus />
          {children}
          <PWAInstallPrompt />
        </QueryProvider>
      </body>
    </html>
  );
}
