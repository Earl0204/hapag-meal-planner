import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'ultra';
  ai_credits_used: number;
  ai_credits_limit: number;
  household_size: number;
  dietary_preferences: string[];
  onboarded: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;  // @supabase/supabase-js User type
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id,username,display_name,avatar_url,plan,ai_credits_used,ai_credits_limit,household_size,dietary_preferences,onboarded')
      .eq('id', userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
    else {
      // Fallback profile if record not yet created by DB trigger
      setProfile({
        id: userId,
        username: null,
        display_name: 'Pamilya User',
        avatar_url: null,
        plan: 'free',
        ai_credits_used: 0,
        ai_credits_limit: 10,
        household_size: 3,
        dietary_preferences: [],
        onboarded: true,
      });
    }
  }

  async function refreshProfile() {
    if (session?.user?.id) await fetchProfile(session.user.id);
  }

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session?.user?.id) fetchProfile(session.user.id).finally(() => setLoading(false));
        else setLoading(false);
      })
      .catch(() => {
        // Supabase placeholder credentials or network error — treat as logged out
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
