import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,

      initialize: async () => {
        try {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            // Fetch user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            set({
              user: session.user,
              profile,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              set({
                user: session.user,
                profile,
                session,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              set({
                user: null,
                profile: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isLoading: false });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          if (data.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            set({
              user: data.user,
              profile,
              session: data.session,
              isAuthenticated: true,
            });
          }

          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      signUp: async (email: string, password: string, name: string, phone?: string) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                phone: phone ? `+62${phone}` : undefined,
                // Role defaults to 'user' in database trigger
              },
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }

          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          profile: null,
          session: null,
          isAuthenticated: false,
        });
      },

      setSession: (session: Session | null) => {
        set({ session });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Legacy compatibility - login function that matches old signature
export const login = async (email: string, password: string, _role: string): Promise<boolean> => {
  const result = await useAuthStore.getState().signIn(email, password);
  return result.success;
};
