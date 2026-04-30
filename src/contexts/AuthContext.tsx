import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string | null }) => Promise<void>;
}

type ProfileRow = Pick<Tables<'profiles'>, 'display_name' | 'avatar_url'>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUser = (supabaseUser: SupabaseUser, profile?: ProfileRow | null): User => ({
  id: supabaseUser.id,
  name:
    profile?.display_name?.trim() ||
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split('@')[0] ||
    'User',
  email: supabaseUser.email || '',
  avatar:
    profile?.avatar_url?.trim() ||
    supabaseUser.user_metadata?.avatar_url ||
    supabaseUser.user_metadata?.picture ||
    undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncUser = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);

      if (!nextSession?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setUser(mapSupabaseUser(nextSession.user));

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', nextSession.user.id)
        .maybeSingle();

      if (!isMounted) return;

      setUser(mapSupabaseUser(nextSession.user, profile));
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void syncUser(initialSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_IN' && nextSession?.access_token) {
        setTimeout(() => {
          void supabase.functions.invoke('login-email', {
            headers: {
              Authorization: `Bearer ${nextSession.access_token}`,
            },
          }).catch((error) => {
            console.error('Login email trigger failed:', error);
          });
        }, 0);
      }

      void syncUser(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; avatar?: string | null }) => {
    if (!session?.user) {
      throw new Error('Not authenticated');
    }

    const displayName = updates.name?.trim() || null;
    const avatarUrl = updates.avatar?.trim() || null;

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: session.user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
        },
        { onConflict: 'user_id' }
      );

    if (profileError) {
      throw profileError;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: displayName,
        avatar_url: avatarUrl,
      },
    });

    if (authError) {
      throw authError;
    }

    setUser(mapSupabaseUser(session.user, {
      display_name: displayName,
      avatar_url: avatarUrl,
    }));
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session?.user,
        isLoading,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
