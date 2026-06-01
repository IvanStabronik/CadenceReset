import * as SecureStore from 'expo-secure-store';

/**
 * Secure storage adapter compatible with Supabase JS client's auth.storage interface.
 * Wraps expo-secure-store to provide encrypted, platform-native token persistence
 * (iOS Keychain, Android Keystore).
 */
export const secureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> =>
    SecureStore.deleteItemAsync(key),
};
