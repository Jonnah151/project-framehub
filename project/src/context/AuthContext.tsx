import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile, type UserRole } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getRoleFromMetadata(authUser: User | null): UserRole {
  const metadataRole = authUser?.user_metadata?.role;
  if (metadataRole === 'admin' || metadataRole === 'customer' || metadataRole === 'designer' || metadataRole === 'photographer' || metadataRole === 'delivery') {
    return metadataRole as UserRole;
  }
  return 'customer';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    const uid = authUser.id;
    const metadataRole = getRoleFromMetadata(authUser);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('Profile load error:', error.message);
    }

    if (data) {
      const profileFromDb = data as Profile;
      const resolvedRole = metadataRole !== 'customer' ? metadataRole : profileFromDb.role;
      setProfile({ ...profileFromDb, role: resolvedRole });
      return;
    }

    const fallbackProfile: Profile = {
      id: uid,
      email: authUser.email ?? '',
      full_name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? '',
      role: metadataRole,
      phone: authUser.user_metadata?.phone ?? '',
      avatar_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('profiles').insert({
      ...fallbackProfile,
    });
    if (insertError) {
      console.error('Profile create error:', insertError.message);
      setProfile(fallbackProfile);
      return;
    }

    setProfile(fallbackProfile);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        setLoading(true);
        loadProfile(data.session.user).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setLoading(true);
        loadProfile(newSession.user).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      setLoading(true);
      await loadProfile(data.user);
      setLoading(false);
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone: string,
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
        },
      },
    });
    if (error) return { error: error.message };
    const uid = data.user?.id;
    if (!uid) return { error: 'Sign-up failed: no user returned.' };

    const safeRole: UserRole = role === 'admin' ? 'customer' : role;
    const profileToInsert: Profile = {
      id: uid,
      email,
      full_name: fullName,
      role: safeRole,
      phone,
      avatar_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase.from('profiles').insert(profileToInsert);
    if (profileError) {
      console.error('Profile create error:', profileError.message);
    }

    setLoading(true);
    await loadProfile(data.user ?? null);
    setLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
