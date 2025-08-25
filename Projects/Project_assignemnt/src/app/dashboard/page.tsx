'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { LogoutButton } from '@/components/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { Dashboard } from '@/components/features/assignments';
import { WelcomeModal } from '@/components/onboarding';
import { Button } from '@/components/ui/button';
import { BookOpen, Upload } from 'lucide-react';
import { Toaster } from 'sonner';
import { isNewUser } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Fetch user profile using tRPC
  const { data: profile, isLoading: profileLoading, error: profileError } = api.user.getProfile.useQuery(
    undefined,
    { 
      enabled: isAuthenticated,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
      retry: (failureCount, error: any) => {
        if (error?.data?.code === 'UNAUTHORIZED') {
          return false;
        }
        return failureCount < 2;
      },
    }
  );

  // Fetch assignments using tRPC
  const { 
    data: assignments = [], 
    isLoading: assignmentsLoading, 
    error: assignmentsError,
    refetch: refetchAssignments
  } = api.assignment.getAll.useQuery(
    undefined,
    { 
      enabled: isAuthenticated,
      staleTime: 2 * 60 * 1000, // 2 minutes - assignments change more frequently
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.data?.code === 'UNAUTHORIZED') {
          return false;
        }
        return failureCount < 3;
      },
    }
  );

  const handleLogoutSuccess = () => {
    router.push('/auth');
  };

  const handleAssignmentCreated = () => {
    refetchAssignments();
  };

  const handleStatusUpdate = () => {
    refetchAssignments();
  };

  // Check if user should see onboarding
  useEffect(() => {
    if (profile && assignments && !profileLoading && !assignmentsLoading) {
      const shouldShowOnboarding = isNewUser(profile, assignments, []);
      setShowWelcomeModal(shouldShowOnboarding);
    }
  }, [profile, assignments, profileLoading, assignmentsLoading]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">Access denied. Please log in.</div>
          <button
            onClick={() => router.push('/auth')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster richColors position="top-right" />
      
      {/* Onboarding Modal */}
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userEmail={profile?.email || user?.email}
      />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Assignment Tracker</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {profile?.email || user?.email}
                {profileError && ' (Profile loading failed)'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/upload-syllabus')}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Syllabus
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/classes')}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Manage Classes
              </Button>
              <LogoutButton onSuccess={handleLogoutSuccess} />
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <Dashboard
        assignments={assignments}
        isLoading={assignmentsLoading}
        error={assignmentsError?.message || null}
        onAssignmentCreated={handleAssignmentCreated}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}