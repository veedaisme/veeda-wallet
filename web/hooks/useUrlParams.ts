import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Custom hook for managing URL parameters in a clean and consistent way
 * Helps prevent navigation issues caused by lingering query parameters
 */
export function useUrlParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Update URL parameters while preserving or removing specific ones
   */
  const updateUrlParams = useCallback((
    updates: Record<string, string | null>,
    options: { replace?: boolean; removeOthers?: string[] } = {}
  ) => {
    const { replace = true, removeOthers = [] } = options;
    const currentUrl = new URL(window.location.href);
    
    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        currentUrl.searchParams.delete(key);
      } else {
        currentUrl.searchParams.set(key, value);
      }
    });
    
    // Remove specified parameters
    removeOthers.forEach(param => {
      currentUrl.searchParams.delete(param);
    });
    
    const newUrl = currentUrl.toString();
    
    if (replace) {
      window.history.replaceState({}, '', newUrl);
    } else {
      router.push(newUrl);
    }
  }, [router]);

  /**
   * Clean URL by removing specified parameters
   */
  const cleanUrl = useCallback((paramsToRemove: string[] = ['from']) => {
    updateUrlParams({}, { removeOthers: paramsToRemove });
  }, [updateUrlParams]);

  /**
   * Navigate to a tab with proper URL parameter management
   */
  const navigateToTab = useCallback((tab: string) => {
    updateUrlParams({ tab }, { removeOthers: ['from'] });
  }, [updateUrlParams]);

  /**
   * Get current parameter value
   */
  const getParam = useCallback((key: string): string | null => {
    return searchParams.get(key);
  }, [searchParams]);

  return {
    updateUrlParams,
    cleanUrl,
    navigateToTab,
    getParam,
  };
}
