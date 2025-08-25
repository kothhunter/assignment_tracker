'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Import auth debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import('@/lib/auth-debug');
}

export default function Home() {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/landing');
      }
    }
  }, [isAuthenticated, isLoading, isInitialized, router]);

  // Show loading spinner while determining authentication status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}