import { supabase } from './client';

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(
  email: string,
  password: string,
  metadata?: { given_name: string; family_name: string }
) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
}

export async function signInWithMicrosoft() {
  return supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'openid profile email',
      redirectTo: window.location.origin,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

export async function getSession() {
  return supabase.auth.getSession();
}
