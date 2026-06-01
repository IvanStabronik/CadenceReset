import { useAuthStore } from '../store/useAuthStore';
import { signInAnonymously } from './auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  timeout?: number;
}

/**
 * Returns the timeout (ms) based on the endpoint path.
 * - /recommendation/match: 10s
 * - /log: 15s
 * - Default: 10s
 */
function getTimeout(path: string): number {
  if (path.includes('/recommendation/match')) return 10000;
  if (path.includes('/log')) return 15000;
  return 10000;
}

/**
 * Makes a single authenticated HTTP request.
 * Reads the current token from the auth store at call time.
 */
async function makeRequest(options: RequestOptions): Promise<Response> {
  const { method, path, body } = options;
  const token = useAuthStore.getState().token;

  if (!token) {
    throw new Error('No auth token available');
  }

  const timeout = options.timeout ?? getTimeout(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Makes an authenticated API request with 401 retry logic.
 *
 * On 401 response:
 * 1. Clears the current token via useAuthStore.getState().logout()
 * 2. Re-authenticates anonymously via Supabase
 * 3. Retries the original request exactly once with the new token
 * 4. If the retry also fails, propagates the error to the caller
 *
 * Validates: Requirement 9.5
 */
export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  let response = await makeRequest(options);

  // On 401: clear token, re-auth anonymously, retry once
  if (response.status === 401) {
    useAuthStore.getState().logout();
    await signInAnonymously();
    response = await makeRequest(options);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(errorData?.message || `HTTP ${response.status}`) as any;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return await response.json();
}

/**
 * Convenience methods for common API calls.
 */
export const api = {
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>({ method: 'POST', path, body }),

  get: <T>(path: string) =>
    apiRequest<T>({ method: 'GET', path }),
};
