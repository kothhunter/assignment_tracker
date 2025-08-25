import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * Hook to get authentication state and actions
 */
export function useAuth() {
  const {
    user,
    session,
    profile,
    isLoading,
    isInitialized,
    signOut,
    initialize,
  } = useAuthStore();

  // Initialize auth state on first use
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return {
    user,
    session,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!user && !!session,
    signOut,
  };
}

/**
 * Hook to check if user is authenticated (returns boolean)
 */
export function useIsAuthenticated() {
  const { user, session } = useAuthStore();
  return !!user && !!session;
}

/**
 * Hook to get current user (returns user or null)
 */
export function useCurrentUser() {
  const { user } = useAuthStore();
  return user;
}

/**
 * Hook to get user profile (returns profile or null)
 */
export function useUserProfile() {
  const { profile } = useAuthStore();
  return profile;
}