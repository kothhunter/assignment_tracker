'use client';

import { useAuth } from '@/hooks';
import { LogoutButton } from '@/components/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { SyllabusUpload } from '@/components/features/syllabus';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowLeft, Upload } from 'lucide-react';

export default function UploadSyllabusPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Fetch user profile using tRPC
  const { data: profile, isLoading: profileLoading, error: profileError } = api.user.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated } // Only fetch when authenticated
  );

  const handleLogoutSuccess = () => {
    router.push('/auth');
  };

  const handleUploadSuccess = () => {
    // Navigate back to dashboard or to a success page
    router.push('/dashboard');
  };

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
                <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Syllabus
                </h1>
                <p className="text-sm text-gray-600">
                  Upload or paste your syllabus for AI parsing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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

      {/* Upload Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SyllabusUpload onSuccess={handleUploadSuccess} />
      </div>
    </div>
  );
}