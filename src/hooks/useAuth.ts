import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthState {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        session: null,
        isLoading: true,
        isAuthenticated: false,
    });

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return data;
    }, []);

    // Initialize auth state
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const profile = await fetchProfile(session.user.id);
                setState({
                    user: session.user,
                    profile,
                    session,
                    isLoading: false,
                    isAuthenticated: true,
                });
            } else {
                setState({
                    user: null,
                    profile: null,
                    session: null,
                    isLoading: false,
                    isAuthenticated: false,
                });
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const profile = await fetchProfile(session.user.id);
                    setState({
                        user: session.user,
                        profile,
                        session,
                        isLoading: false,
                        isAuthenticated: true,
                    });
                } else {
                    setState({
                        user: null,
                        profile: null,
                        session: null,
                        isLoading: false,
                        isAuthenticated: false,
                    });
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // Sign up with email and password
    const signUp = async (email: string, password: string, name: string, role: 'user' | 'seller' = 'user') => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role,
                },
            },
        });

        if (error) throw error;
        return data;
    };

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    };

    // Sign out
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    // Update profile
    const updateProfile = async (updates: Partial<Profile>) => {
        if (!state.user) throw new Error('No user logged in');

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', state.user.id)
            .select()
            .single();

        if (error) throw error;

        setState(prev => ({
            ...prev,
            profile: data,
        }));

        return data;
    };

    return {
        ...state,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refetchProfile: () => state.user && fetchProfile(state.user.id),
    };
}

// Hook for checking role-based access
export function useRole() {
    const { profile, isLoading } = useAuth();

    return {
        role: profile?.role || null,
        isUser: profile?.role === 'user',
        isSeller: profile?.role === 'seller',
        isAdmin: profile?.role === 'admin',
        isLoading,
    };
}
