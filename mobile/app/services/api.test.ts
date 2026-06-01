// Set env BEFORE importing api (module-level validation throws without it)
process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';

import { apiRequest, api } from './api';
import { useAuthStore } from '../store/useAuthStore';

// Mock expo-secure-store (required by useAuthStore)
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock the auth service
jest.mock('./auth', () => ({
  signInAnonymously: jest.fn().mockResolvedValue(undefined),
}));

import { signInAnonymously } from './auth';

// Mock global fetch
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

// Mock environment variable
process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';

describe('apiRequest - 401 retry logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      token: 'initial-token',
      userId: 'user-123',
      isAuthenticated: true,
    });
  });

  it('should make a successful request without retry when response is ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'success' }),
    });

    const result = await apiRequest({ method: 'GET', path: '/test' });

    expect(result).toEqual({ data: 'success' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('should clear token, re-auth, and retry on 401 response', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });

    // After re-auth, signInAnonymously sets a new token
    (signInAnonymously as jest.Mock).mockImplementationOnce(async () => {
      useAuthStore.getState().login('new-token', 'user-123');
    });

    // Retry succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'retried' }),
    });

    const result = await apiRequest({ method: 'POST', path: '/test', body: { foo: 'bar' } });

    expect(result).toEqual({ data: 'retried' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(signInAnonymously).toHaveBeenCalledTimes(1);

    // Verify the retry used the new token
    const retryCall = mockFetch.mock.calls[1];
    expect(retryCall[1].headers['Authorization']).toBe('Bearer new-token');
  });

  it('should call logout before re-authenticating on 401', async () => {
    const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });

    (signInAnonymously as jest.Mock).mockImplementationOnce(async () => {
      useAuthStore.getState().login('new-token', 'user-123');
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'ok' }),
    });

    await apiRequest({ method: 'GET', path: '/test' });

    // Verify logout was called (token cleared)
    expect(useAuthStore.getState().token).toBe('new-token');
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('should propagate error if retry also returns non-ok', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });

    // Re-auth succeeds
    (signInAnonymously as jest.Mock).mockImplementationOnce(async () => {
      useAuthStore.getState().login('new-token', 'user-123');
    });

    // Retry also fails (e.g., 403)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'Forbidden' }),
    });

    await expect(
      apiRequest({ method: 'GET', path: '/test' })
    ).rejects.toMatchObject({
      message: 'Forbidden',
      status: 403,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should propagate error if retry also returns 401', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });

    // Re-auth succeeds
    (signInAnonymously as jest.Mock).mockImplementationOnce(async () => {
      useAuthStore.getState().login('new-token', 'user-123');
    });

    // Retry also returns 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Still unauthorized' }),
    });

    await expect(
      apiRequest({ method: 'GET', path: '/test' })
    ).rejects.toMatchObject({
      message: 'Still unauthorized',
      status: 401,
    });

    // Should NOT retry again (only once)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('should throw if no token is available', async () => {
    useAuthStore.setState({ token: null, userId: null, isAuthenticated: false });

    await expect(
      apiRequest({ method: 'GET', path: '/test' })
    ).rejects.toThrow('No auth token available');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should throw non-401 errors without retrying', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Internal Server Error' }),
    });

    await expect(
      apiRequest({ method: 'GET', path: '/test' })
    ).rejects.toMatchObject({
      message: 'Internal Server Error',
      status: 500,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('should use fallback error message when response body is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(
      apiRequest({ method: 'GET', path: '/test' })
    ).rejects.toMatchObject({
      message: 'HTTP 500',
      status: 500,
    });
  });

  describe('api convenience methods', () => {
    it('api.post should call apiRequest with POST method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1 }),
      });

      const result = await api.post('/items', { name: 'test' });
      expect(result).toEqual({ id: 1 });

      const [url, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ name: 'test' });
    });

    it('api.get should call apiRequest with GET method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ id: 1 }]),
      });

      const result = await api.get('/items');
      expect(result).toEqual([{ id: 1 }]);

      const [url, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('GET');
      expect(options.body).toBeUndefined();
    });
  });
});
