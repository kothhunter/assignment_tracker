import { useEffect } from 'react';
import { api } from '@/lib/trpc';
import { useAssignmentStore } from '@/stores/assignments';
import { useAuth } from './use-auth';

/**
 * Custom hook that integrates assignment store with tRPC data fetching
 * Provides a unified interface for assignment data management
 */
export function useAssignments() {
  const { isAuthenticated } = useAuth();
  const {
    assignments,
    isLoading: storeLoading,
    error: storeError,
    setAssignments,
    setLoading,
    setError,
    updateAssignmentStatus,
    addAssignment,
    removeAssignment,
    clearAssignments,
    getAssignmentById,
    getCompletedAssignments,
    getIncompleteAssignments,
    getOverdueAssignments,
    getAssignmentsByClass,
  } = useAssignmentStore();

  // Fetch assignments using tRPC
  const {
    data: fetchedAssignments,
    isLoading: tRPCLoading,
    error: tRPCError,
    refetch,
  } = api.assignment.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync tRPC data with store
  useEffect(() => {
    if (fetchedAssignments) {
      setAssignments(fetchedAssignments);
      setLoading(false);
    }
  }, [fetchedAssignments, setAssignments, setLoading]);

  // Sync loading state
  useEffect(() => {
    setLoading(tRPCLoading);
  }, [tRPCLoading, setLoading]);

  // Sync error state
  useEffect(() => {
    setError(tRPCError?.message || null);
  }, [tRPCError, setError]);

  // Clear assignments when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearAssignments();
    }
  }, [isAuthenticated, clearAssignments]);

  // Assignment status mutation
  const updateStatusMutation = api.assignment.updateStatus.useMutation({
    onSuccess: () => {
      // Optimistically update the store, then refetch to ensure consistency
      refetch();
    },
    onError: (error) => {
      console.error('Failed to update assignment status:', error);
      // Revert optimistic update on error
      refetch();
    },
  });

  const updateStatus = async (id: number, status: 'complete' | 'incomplete') => {
    // Optimistic update
    updateAssignmentStatus(id, status);
    
    try {
      await updateStatusMutation.mutateAsync({
        id: id,
        status,
      });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      throw error;
    }
  };

  const refresh = () => {
    refetch();
  };

  return {
    // Data
    assignments,
    isLoading: storeLoading || tRPCLoading,
    error: storeError,

    // Actions
    updateStatus,
    refresh,

    // Computed values
    getAssignmentById,
    getCompletedAssignments,
    getIncompleteAssignments,
    getOverdueAssignments,
    getAssignmentsByClass,

    // Statistics
    totalAssignments: assignments.length,
    completedCount: getCompletedAssignments().length,
    incompleteCount: getIncompleteAssignments().length,
    overdueCount: getOverdueAssignments().length,
  };
}