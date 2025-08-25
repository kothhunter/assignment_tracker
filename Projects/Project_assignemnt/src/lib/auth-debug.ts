/**
 * Development utilities for debugging auth issues
 */

export function clearAuthStorage() {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage auth data
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('auth') || key.includes('supabase')
  );
  
  authKeys.forEach(key => {
    console.log('Clearing auth key:', key);
    localStorage.removeItem(key);
  });
  
  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
    if (name.includes('sb-') || name.includes('supabase')) {
      console.log('Clearing auth cookie:', name);
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  });
  
  console.log('Auth storage cleared. Refresh the page.');
}

export function debugAuthState() {
  if (typeof window === 'undefined') return;
  
  console.log('=== Auth Debug Info ===');
  console.log('localStorage auth keys:', 
    Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('supabase')
    )
  );
  console.log('Auth cookies:', 
    document.cookie.split(';').filter(c => 
      c.includes('sb-') || c.includes('supabase')
    )
  );
  
  // Check Zustand persist storage
  const persistedAuth = localStorage.getItem('auth-storage');
  if (persistedAuth) {
    try {
      console.log('Persisted auth state:', JSON.parse(persistedAuth));
    } catch (e) {
      console.log('Failed to parse persisted auth state:', persistedAuth);
    }
  }
}

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).clearAuthStorage = clearAuthStorage;
  (window as any).debugAuthState = debugAuthState;
}