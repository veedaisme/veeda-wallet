"use client";

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

export function NetworkStatus() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null; // Don't show anything when fully online
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
      !isOnline 
        ? 'bg-red-600 text-white' 
        : 'bg-yellow-500 text-black'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Some features may be limited.</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span>Slow connection detected</span>
          </>
        )}
      </div>
    </div>
  );
}