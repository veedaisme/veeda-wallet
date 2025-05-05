"use client";

import { ReactNode } from "react";
import { LanguagePillToggle } from "@/components/ui/language-pill-toggle";

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="absolute top-4 right-4 z-50">
        <LanguagePillToggle />
      </div>
      {children}
    </div>
  );
}
