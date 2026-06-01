import { createClient } from '@supabase/supabase-js';
import { secureStoreAdapter } from './secureStorage';
import { useAuthStore } from '../store/useAuthStore';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Initiates anonymous sign-in via Supabase Auth.
 * On success, stores the JWT token and user ID in the auth store.
 */
export async function signInAnonymously(): Promise<void> {
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (data.session) {
    const { access_token, user } = data.session;
    useAuthStore.getState().login(access_token, user.id);
  }
}

/**
 * Attempts to restore an existing session from secure storage.
 * If a valid session exists, hydrates the auth store.
 * If no session or expired, returns false so the caller can trigger anonymous sign-in.
 */
export async function restoreSession(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    return false;
  }

  const { access_token, user } = data.session;
  useAuthStore.getState().login(access_token, user.id);
  return true;
}
