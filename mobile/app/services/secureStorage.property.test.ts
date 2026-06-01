import * as fc from 'fast-check';

// Track all storage calls
const secureStoreCalls: { method: string; key: string }[] = [];
const asyncStorageCalls: { method: string; key: string }[] = [];

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn((key: string, value: string) => {
    secureStoreCalls.push({ method: 'setItem', key });
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((key: string) => {
    secureStoreCalls.push({ method: 'getItem', key });
    return Promise.resolve(null);
  }),
  deleteItemAsync: jest.fn((key: string) => {
    secureStoreCalls.push({ method: 'removeItem', key });
    return Promise.resolve();
  }),
}));

// Mock AsyncStorage to verify it's NEVER used for tokens
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key: string) => {
    asyncStorageCalls.push({ method: 'setItem', key });
    return Promise.resolve();
  }),
  getItem: jest.fn((key: string) => {
    asyncStorageCalls.push({ method: 'getItem', key });
    return Promise.resolve(null);
  }),
  removeItem: jest.fn((key: string) => {
    asyncStorageCalls.push({ method: 'removeItem', key });
    return Promise.resolve();
  }),
}), { virtual: true });

import { useAuthStore } from '../store/useAuthStore';

/**
 * Property 12: Secure storage exclusivity for JWT
 * For any app session, the JWT token exists in exactly one persistent storage location:
 * expo-secure-store. The token is never written to AsyncStorage or any unencrypted mechanism.
 * Validates: Requirements 9.6, 9.7
 */
describe('Property 12: Secure storage exclusivity for JWT', () => {
  beforeEach(() => {
    secureStoreCalls.length = 0;
    asyncStorageCalls.length = 0;
    useAuthStore.setState({ token: null, userId: null, isAuthenticated: false });
    jest.clearAllMocks();
  });

  it('login always writes token to secure store, never to AsyncStorage', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 200 }), // random token
        fc.uuid(), // random userId
        (token, userId) => {
          secureStoreCalls.length = 0;
          asyncStorageCalls.length = 0;

          useAuthStore.getState().login(token, userId);

          // Secure store should have been called for token persistence
          const tokenWrites = secureStoreCalls.filter(
            c => c.method === 'setItem' && c.key === 'cadence_auth_token'
          );
          const asyncTokenWrites = asyncStorageCalls.filter(
            c => c.key.includes('token') || c.key.includes('auth')
          );

          return tokenWrites.length > 0 && asyncTokenWrites.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('logout always removes token from secure store, never touches AsyncStorage', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        secureStoreCalls.length = 0;
        asyncStorageCalls.length = 0;

        useAuthStore.getState().logout();

        const tokenDeletes = secureStoreCalls.filter(
          c => c.method === 'removeItem' && c.key === 'cadence_auth_token'
        );
        const asyncTokenDeletes = asyncStorageCalls.filter(
          c => c.key.includes('token') || c.key.includes('auth')
        );

        return tokenDeletes.length > 0 && asyncTokenDeletes.length === 0;
      }),
      { numRuns: 100 },
    );
  });
});
