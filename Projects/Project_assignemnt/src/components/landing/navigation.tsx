'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function Navigation() {
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => router.push('/landing')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Assignment Tracker</span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost"
              onClick={() => router.push('/auth')}
              className="text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => router.push('/auth')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function BackToLanding() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.push('/landing')}
      className="fixed top-4 left-4 z-50 text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Home
    </Button>
  );
}