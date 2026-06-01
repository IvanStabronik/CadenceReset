import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthState } from '../types';

const TOKEN_KEY = 'cadence_auth_token';
const USER_ID_KEY = 'cadence_user_id';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  isAuthenticated: false,

  login: (token: string, userId: string) => {
    SecureStore.setItemAsync(TOKEN_KEY, token);
    SecureStore.setItemAsync(USER_ID_KEY, userId);
    set({ token, userId, isAuthenticated: true });
  },

  logout: () => {
    SecureStore.deleteItemAsync(TOKEN_KEY);
    SecureStore.deleteItemAsync(USER_ID_KEY);
    set({ token: null, userId: null, isAuthenticated: false });
  },

  restoreToken: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const userId = await SecureStore.getItemAsync(USER_ID_KEY);
    if (token && userId) {
      set({ token, userId, isAuthenticated: true });
    }
  },
}));
