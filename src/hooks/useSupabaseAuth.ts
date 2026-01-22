import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface Profile {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
  avatar_config: Json;
  theme_preference: Json;
  branch: string | null;
  year: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
  });
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
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

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({ ...prev, session, user: session?.user ?? null }));
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking auth state update
          setTimeout(async () => {
            const profile = await fetchProfile(session.user.id);
            setAuthState(prev => ({ ...prev, profile, isLoading: false }));
          }, 0);
        } else {
          setAuthState(prev => ({ ...prev, profile: null, isLoading: false }));
        }
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({ ...prev, session, user: session?.user ?? null }));
      
      if (session?.user) {
        fetchProfile(session.user.id).then(profile => {
          setAuthState(prev => ({ ...prev, profile, isLoading: false }));
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    branch: string, 
    year: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          username: email.split('@')[0],
        }
      }
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign up failed',
        description: error.message
      });
      return { success: false, error };
    }

    // Update profile with branch and year
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ branch, year, full_name: fullName })
        .eq('id', data.user.id);
    }

    toast({
      title: 'Welcome to StudySync!',
      description: 'Your account has been created successfully.'
    });

    return { success: true, data };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message
      });
      return { success: false, error };
    }

    toast({
      title: 'Welcome back!',
      description: 'You have logged in successfully.'
    });

    return { success: true, data };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign out failed',
        description: error.message
      });
      return { success: false, error };
    }
    
    setAuthState({
      user: null,
      profile: null,
      session: null,
      isLoading: false
    });

    return { success: true };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!authState.user) return { success: false, error: 'No user logged in' };

    const { error } = await supabase
      .from('profiles')
      .update(updates as Record<string, unknown>)
      .eq('id', authState.user.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message
      });
      return { success: false, error };
    }

    // Refresh profile
    const profile = await fetchProfile(authState.user.id);
    setAuthState(prev => ({ ...prev, profile }));

    toast({
      title: 'Profile updated',
      description: 'Your changes have been saved.'
    });

    return { success: true };
  };

  return {
    user: authState.user,
    profile: authState.profile,
    session: authState.session,
    isLoading: authState.isLoading,
    isAuthenticated: !!authState.user,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refetchProfile: () => authState.user && fetchProfile(authState.user.id)
  };
}
