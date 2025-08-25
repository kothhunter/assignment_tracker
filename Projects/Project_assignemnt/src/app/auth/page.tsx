'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm, SignupForm } from '@/components/auth';
import { BackToLanding } from '@/components/landing';

function AuthPageContent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleAuthSuccess = () => {
    // Get redirect parameter from URL or default to dashboard
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    
    // Ensure redirect URL is safe (starts with /)
    const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
    
    router.push(safeRedirect as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <BackToLanding />
      <div className="max-w-md w-full">
        {isSignUp ? (
          <SignupForm 
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setIsSignUp(false)}
          />
        ) : (
          <LoginForm 
            onSuccess={handleAuthSuccess}
            onSwitchToSignup={() => setIsSignUp(true)}
          />
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}