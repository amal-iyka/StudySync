/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useTheme } from '@/hooks/useTheme';

interface AuthContextType {
  user: ReturnType<typeof useSupabaseAuth>['user'];
  profile: ReturnType<typeof useSupabaseAuth>['profile'];
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: ReturnType<typeof useSupabaseAuth>['signUp'];
  signIn: ReturnType<typeof useSupabaseAuth>['signIn'];
  signOut: ReturnType<typeof useSupabaseAuth>['signOut'];
  updateProfile: ReturnType<typeof useSupabaseAuth>['updateProfile'];
  theme: ReturnType<typeof useTheme>['theme'];
  toggleMode: ReturnType<typeof useTheme>['toggleMode'];
  setAccentColor: ReturnType<typeof useTheme>['setAccentColor'];
  accentColors: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth();
  const themeHook = useTheme(auth.user?.id);

  return (
    <AuthContext.Provider 
      value={{ 
        user: auth.user,
        profile: auth.profile,
        isAuthenticated: auth.isAuthenticated, 
        isLoading: auth.isLoading,
        signUp: auth.signUp,
        signIn: auth.signIn, 
        signOut: auth.signOut,
        updateProfile: auth.updateProfile,
        theme: themeHook.theme,
        toggleMode: themeHook.toggleMode,
        setAccentColor: themeHook.setAccentColor,
        accentColors: themeHook.accentColors
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
