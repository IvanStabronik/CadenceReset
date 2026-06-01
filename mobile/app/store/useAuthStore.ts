import { create } from 'zustand';
import { AuthState } from '../types';

/**
 * Auth store — in-memory only.
 * 
 * Supabase client handles persistent storage of the session via secureStoreAdapter.
 * This store holds the current token/userId for reactive UI updates and API interceptor access.
 * It does NOT write to SecureStore directly — that's Supabase's responsibility.
 */
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  isAuthenticated: false,

  login: (token: string, userId: string) => {
    set({ token, userId, isAuthenticated: true });
  },

  logout: () => {
    set({ token: null, userId: null, isAuthenticated: false });
  },

  restoreToken: async () => {
    // No-op: session restoration is handled by Supabase client's getSession()
    // which reads from SecureStore via the adapter. The result is passed to login().
  },
}));
