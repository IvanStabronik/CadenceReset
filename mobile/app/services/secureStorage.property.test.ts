import * as fc from 'fast-check';

/**
 * Property 12: Secure storage exclusivity for JWT
 * 
 * The architecture ensures JWT tokens are ONLY stored via expo-secure-store
 * (through the secureStoreAdapter used by Supabase client).
 * useAuthStore is in-memory only — it does NOT write to any persistent storage.
 * 
 * This test verifies:
 * 1. The secureStoreAdapter interface is correct for Supabase
 * 2. useAuthStore.login/logout do NOT call SecureStore directly
 * 
 * Validates: Requirements 9.6, 9.7
 */

// Track SecureStore calls to verify useAuthStore does NOT use them
const secureStoreCalls: string[] = [];

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn((key: string) => {
    secureStoreCalls.push(`set:${key}`);
    return Promise.resolve();
  }),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn((key: string) => {
    secureStoreCalls.push(`delete:${key}`);
    return Promise.resolve();
  }),
}));

import { useAuthStore } from '../store/useAuthStore';
import { secureStoreAdapter } from './secureStorage';

describe('Property 12: Secure storage exclusivity for JWT', () => {
  beforeEach(() => {
    secureStoreCalls.length = 0;
    useAuthStore.setState({ token: null, userId: null, isAuthenticated: false });
    jest.clearAllMocks();
  });

  it('secureStoreAdapter exposes the correct interface for Supabase', () => {
    expect(secureStoreAdapter).toHaveProperty('getItem');
    expect(secureStoreAdapter).toHaveProperty('setItem');
    expect(secureStoreAdapter).toHaveProperty('removeItem');
    expect(typeof secureStoreAdapter.getItem).toBe('function');
    expect(typeof secureStoreAdapter.setItem).toBe('function');
    expect(typeof secureStoreAdapter.removeItem).toBe('function');
  });

  it('useAuthStore.login does NOT write to SecureStore (in-memory only)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 200 }),
        fc.uuid(),
        (token, userId) => {
          secureStoreCalls.length = 0;

          useAuthStore.getState().login(token, userId);

          // No SecureStore calls should happen from login
          return secureStoreCalls.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('useAuthStore.logout does NOT write to SecureStore (in-memory only)', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        secureStoreCalls.length = 0;

        useAuthStore.getState().logout();

        // No SecureStore calls should happen from logout
        return secureStoreCalls.length === 0;
      }),
      { numRuns: 100 },
    );
  });

  it('secureStoreAdapter.setItem writes to expo-secure-store', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        async (key, value) => {
          secureStoreCalls.length = 0;
          await secureStoreAdapter.setItem(key, value);
          return secureStoreCalls.includes(`set:${key}`);
        },
      ),
      { numRuns: 50 },
    );
  });
});
