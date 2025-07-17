"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface AppLoadingProps {
  message?: string;
  showLogo?: boolean;
  className?: string;
}

export function AppLoading({ 
  message = "Loading...", 
  showLogo = true, 
  className = "" 
}: AppLoadingProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center ${className}`}>
      {/* Logo with animation */}
      {showLogo && (
        <div className="mb-8 animate-fade-in">
          <Image
            src="/clair_v2_logo.png"
            alt="Clair"
            width={200}
            height={89}
            className="h-20 w-auto transition-opacity duration-300"
            priority
          />
        </div>
      )}
      
      {/* Loading indicator */}
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="text-gray-600 text-lg font-medium min-w-[120px] text-center">
          {message}{dots}
        </p>
      </div>
      
      {/* Subtle background animation */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gray-400 rounded-full animate-ping" style={{animationDelay: '1000ms'}}></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gray-400 rounded-full animate-ping" style={{animationDelay: '2000ms'}}></div>
      </div>
    </div>
  );
}

export function AppLoadingMinimal({ message = "Loading..." }: { message?: string }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <span className="text-gray-600 font-medium">
          {message}{dots}
        </span>
      </div>
    </div>
  );
}