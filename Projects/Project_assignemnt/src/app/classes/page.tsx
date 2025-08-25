'use client';

import { useAuth, useClasses } from '@/hooks';
import { LogoutButton } from '@/components/auth';
import { ClassList } from '@/components/features/classes';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Toaster } from 'sonner';

export default function ClassesPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { classes, isLoading: classesLoading, error } = useClasses();
  const router = useRouter();

  const handleLogoutSuccess = () => {
    router.push('/auth');
  };

  if (authLoading) {
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
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Class Management</h1>
                <p className="text-sm text-gray-600">
                  Organize your classes and keep track of your courses
                </p>
              </div>
            </div>
            <LogoutButton onSuccess={handleLogoutSuccess} />
          </div>
        </div>
      </div>

      {/* Classes Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-medium mb-2">Failed to load classes</h3>
              <p className="text-sm text-red-700">
                Error details: {error}
              </p>
              <p className="text-xs text-red-600 mt-2">
                Check the browser console for more details
              </p>
            </div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <ClassList classes={classes} isLoading={classesLoading} />
        )}
      </div>
    </div>
  );
}