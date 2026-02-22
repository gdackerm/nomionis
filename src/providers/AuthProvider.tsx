import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import {
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  onAuthStateChange,
  getSession,
} from '../lib/supabase/auth';
import type { Tables } from '../lib/supabase/types';

type Practitioner = Tables<'practitioners'>;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  practitioner: Practitioner | null;
  organizationId: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchPractitioner(userId: string): Promise<Practitioner | null> {
  const { data, error } = await supabase
    .from('practitioners')
    .select('*')
    .eq('auth_user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching practitioner:', error);
    return null;
  }

  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        fetchPractitioner(initialSession.user.id).then((p) => {
          setPractitioner(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchPractitioner(newSession.user.id).then((p) => {
          setPractitioner(p);
          setLoading(false);
        });
      } else {
        setPractitioner(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const organizationId = practitioner?.organization_id ?? null;

  const value: AuthContextValue = {
    session,
    user,
    practitioner,
    organizationId,
    loading,
    signInWithGoogle: authSignInWithGoogle,
    signOut: authSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useCurrentUser(): Practitioner | null {
  const { practitioner } = useAuth();
  return practitioner;
}
