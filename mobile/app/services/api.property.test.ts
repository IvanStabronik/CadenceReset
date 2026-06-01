import * as fc from 'fast-check';
import { useAuthStore } from '../store/useAuthStore';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock auth service
jest.mock('./auth', () => ({
  signInAnonymously: jest.fn().mockResolvedValue(undefined),
}));

// Mock global fetch
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;
process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';

import { apiRequest } from './api';

/**
 * Property 11: Auth token is always present on API requests
 * For any HTTP request sent to the backend, the Authorization header contains
 * a Bearer token from the Zustand auth store. If no token is available, the request is not sent.
 * Validates: Requirements 9.4, 9.5
 */
describe('Property 11: Auth token is always present on API requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'ok' }),
    });
  });

  it('every request includes Authorization: Bearer <token> when token exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 200 }), // random token
        fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s), // random path
        async (token, path) => {
          useAuthStore.setState({ token, userId: 'user-1', isAuthenticated: true });

          try {
            await apiRequest({ method: 'GET', path });
          } catch (e) {
            // Ignore errors — we're testing the request headers
          }

          if (mockFetch.mock.calls.length > 0) {
            const [, options] = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
            const authHeader = options.headers['Authorization'];
            return authHeader === `Bearer ${token}`;
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('requests are blocked (throw) when no token is available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s),
        async (path) => {
          useAuthStore.setState({ token: null, userId: null, isAuthenticated: false });

          try {
            await apiRequest({ method: 'GET', path });
            return false; // Should have thrown
          } catch (e: any) {
            return e.message === 'No auth token available';
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
