import { useEffect } from 'react';
import { api } from '@/lib/trpc';
import { useClassStore } from '@/stores/classes';
import { useAuth } from './use-auth';

/**
 * Custom hook that integrates class store with tRPC data fetching
 * Provides a unified interface for class data management
 */
export function useClasses() {
  const { isAuthenticated } = useAuth();
  const {
    classes,
    isLoading: storeLoading,
    error: storeError,
    setClasses,
    setLoading,
    setError,
    addClass,
    updateClass,
    removeClass,
    clearClasses,
    getClassById,
    getClassByName,
    getClassCount,
    isClassNameTaken,
  } = useClassStore();

  // Fetch classes using tRPC
  const {
    data: fetchedClasses,
    isLoading: tRPCLoading,
    error: tRPCError,
    refetch,
  } = api.class.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on unauthorized errors
      if (error?.data?.code === 'UNAUTHORIZED') {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Sync tRPC data with store
  useEffect(() => {
    if (fetchedClasses) {
      setClasses(fetchedClasses);
      setLoading(false);
    }
  }, [fetchedClasses, setClasses, setLoading]);

  // Sync loading state
  useEffect(() => {
    setLoading(tRPCLoading);
  }, [tRPCLoading, setLoading]);

  // Sync error state
  useEffect(() => {
    setError(tRPCError?.message || null);
  }, [tRPCError, setError]);

  // Clear classes when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearClasses();
    }
  }, [isAuthenticated, clearClasses]);

  const refresh = () => {
    refetch();
  };

  return {
    // Data
    classes,
    isLoading: storeLoading || tRPCLoading,
    error: storeError,

    // Actions
    refresh,

    // Computed values
    getClassById,
    getClassByName,
    getClassCount,
    isClassNameTaken,

    // Statistics
    totalClasses: classes.length,
  };
}