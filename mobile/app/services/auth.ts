import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { secureStoreAdapter } from './secureStorage';
import { useAuthStore } from '../store/useAuthStore';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: secureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } catch (e) {
    console.warn('Failed to create Supabase client:', e);
  }
}

export { supabase };

export async function signInAnonymously(): Promise<void> {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (data.session) {
      const { access_token, user } = data.session;
      useAuthStore.getState().login(access_token, user.id);
    }
  } catch (e) {
    console.warn('signInAnonymously failed:', e);
  }
}

export async function restoreSession(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return false;
    const { access_token, user } = data.session;
    useAuthStore.getState().login(access_token, user.id);
    return true;
  } catch (e) {
    console.warn('restoreSession failed:', e);
    return false;
  }
}
