import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "SpendWise",
  description: "Track and analyze your spending habits",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className={`${inter.className} bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
