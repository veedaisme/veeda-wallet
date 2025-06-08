import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const TransactionSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border p-4 mb-3">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="text-right">
        <Skeleton className="h-5 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
);

export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <TransactionSkeleton key={index} />
    ))}
  </div>
);

export const TransactionSearchSkeleton: React.FC = () => (
  <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
    <Skeleton className="w-full md:w-64 h-10 rounded-lg" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-16 rounded-lg" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);

export const DashboardCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border p-6 animate-pulse">
    <Skeleton className="h-4 w-1/2 mb-4" />
    <Skeleton className="h-8 w-3/4 mb-2" />
    <Skeleton className="h-3 w-1/3" />
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <DashboardCardSkeleton key={i} />
    ))}
  </div>
);

// Subscription Skeletons
export const SubscriptionCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <Skeleton className="h-5 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="text-right">
        <Skeleton className="h-6 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-3 w-1/4" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  </div>
);

export const SubscriptionListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SubscriptionCardSkeleton key={i} />
    ))}
  </div>
);

export const SubscriptionPageSkeleton: React.FC = () => (
  <div className="p-4 space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <SubscriptionCardSkeleton key={i} />
    ))}
  </div>
);
