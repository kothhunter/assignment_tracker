'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';

interface LogoutButtonProps {
  onSuccess?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ 
  onSuccess, 
  variant = 'outline', 
  size = 'default',
  className = '',
  children = 'Sign out'
}: LogoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const { signOut, isLoading } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
      onSuccess?.();
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during logout');
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? 'Signing out...' : children}
    </Button>
  );
}