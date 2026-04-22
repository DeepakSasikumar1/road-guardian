import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'authority';
  department?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string, phone?: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string, userEmail: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const authUser: AuthUser = {
        id: userId,
        name: profile?.name || userEmail.split('@')[0],
        email: userEmail,
        role: (roleData?.role as 'admin' | 'authority') || 'authority',
        department: profile?.department || 'Road Authority',
      };

      setUser(authUser);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser({
        id: userId,
        name: userEmail.split('@')[0],
        email: userEmail,
        role: 'authority',
        department: 'Road Authority',
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id, session.user.email || '');
          }, 0);
        } else {
          setUser(null);
        }

        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || '');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      toast({ title: "Welcome back!", description: "Successfully logged in to RoadWatch AI" });
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, name: string, phone?: string): Promise<{ error: string | null }> => {
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name, phone },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'This email is already registered. Please login instead.' };
        }
        return { error: error.message };
      }

      // If we have a phone number, updated the profile explicitly
      // because the trigger might only handle name
      if (signUpData.user && phone) {
        await supabase
          .from('profiles')
          .update({ phone: phone })
          .eq('id', signUpData.user.id);
      }
      toast({ title: "Account created!", description: "Welcome to RoadWatch AI." });
      return { error: null };
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast({ title: "Logged out", description: "You have been signed out successfully" });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!session,
      isLoading,
      login,
      signup,
      logout,
      refreshProfile: () => fetchUserProfile(session?.user?.id || '', session?.user?.email || ''),
    }}>
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
