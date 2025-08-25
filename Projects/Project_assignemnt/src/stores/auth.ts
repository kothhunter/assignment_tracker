import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      
      setSession: (session) => set({ session }),
      
      setProfile: (profile) => set({ profile }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setInitialized: (isInitialized) => set({ isInitialized }),

      signOut: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          // Reset all auth state
          set({
            user: null,
            session: null,
            profile: null,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error signing out:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      initialize: async () => {
        set({ isLoading: true });
        
        try {
          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth initialization error:', error);
            throw error;
          }

          // Check if session is expired
          const isSessionValid = session && session.expires_at && 
            new Date(session.expires_at * 1000) > new Date();

          if (session && isSessionValid) {
            set({
              user: session.user,
              session,
              isLoading: false,
              isInitialized: true,
            });

            // Note: Profile fetching is handled by components via tRPC hooks
            // This maintains separation of concerns between state management and API calls
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              isLoading: false,
              isInitialized: true,
            });
          }

          // Set up auth state change listener
          supabase.auth.onAuthStateChange(async (event, session) => {
            
            // Check if session is expired
            const isSessionValid = session && session.expires_at && 
              new Date(session.expires_at * 1000) > new Date();
            
            if (session && isSessionValid) {
              set({
                user: session.user,
                session,
                isLoading: false,
              });
              
              // Note: Profile fetching is handled by components via tRPC hooks
              // This maintains separation of concerns between state management and API calls
            } else {
              set({
                user: null,
                session: null,
                profile: null,
                isLoading: false,
              });
            }
          });

        } catch (error) {
          console.error('Error initializing auth:', error);
          set({
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        session: state.session,
        profile: state.profile,
        isInitialized: state.isInitialized,
      }),
    }
  )
);