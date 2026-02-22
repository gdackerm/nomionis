import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import {
  signInWithPassword as authSignInWithPassword,
  signUp as authSignUp,
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
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, givenName: string, familyName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchPractitioner(userId: string): Promise<Practitioner | null> {
  const { data, error } = await supabase
    .from('practitioners')
    .select('*')
    .eq('auth_user_id', userId)
    .maybeSingle();

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

  const handleSignIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await authSignInWithPassword(email, password);
    if (error) {
      return { error: error.message };
    }
    return {};
  };

  const handleSignUp = async (
    email: string,
    password: string,
    givenName: string,
    familyName: string
  ): Promise<{ error?: string }> => {
    const { error: signUpError } = await authSignUp(email, password, {
      given_name: givenName,
      family_name: familyName,
    });

    if (signUpError) {
      return { error: signUpError.message };
    }

    // Explicitly sign in to ensure a valid session for subsequent queries
    const { data: signInData, error: signInError } = await authSignInWithPassword(email, password);
    if (signInError) {
      return { error: signInError.message };
    }

    const newUser = signInData.user;
    if (!newUser) {
      return { error: 'Sign in after sign up failed' };
    }

    // Create organization and practitioner with client-generated UUIDs
    // to avoid RETURNING-clause RLS conflicts (no practitioner exists yet
    // so org-scoped SELECT policies would reject the returned rows).
    const orgId = crypto.randomUUID();
    const { error: orgCreateError } = await supabase
      .from('organizations')
      .insert({ id: orgId, name: 'My Practice', type: 'prov', active: true });

    if (orgCreateError) {
      return { error: orgCreateError.message };
    }

    const practitionerId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error: practitionerError } = await supabase
      .from('practitioners')
      .insert({
        id: practitionerId,
        organization_id: orgId,
        auth_user_id: newUser.id,
        given_name: givenName,
        family_name: familyName,
        email,
        active: true,
      });

    if (practitionerError) {
      return { error: practitionerError.message };
    }

    setPractitioner({
      id: practitionerId,
      organization_id: orgId,
      auth_user_id: newUser.id,
      given_name: givenName,
      family_name: familyName,
      email,
      phone: null,
      npi: null,
      specialties: null,
      active: true,
      created_at: now,
      updated_at: now,
    });
    return {};
  };

  const user = session?.user ?? null;
  const organizationId = practitioner?.organization_id ?? null;

  const value: AuthContextValue = {
    session,
    user,
    practitioner,
    organizationId,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
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
