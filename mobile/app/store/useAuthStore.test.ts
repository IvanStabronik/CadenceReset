import { useAuthStore } from './useAuthStore';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as SecureStore from 'expo-secure-store';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      token: null,
      userId: null,
      isAuthenticated: false,
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have null token, null userId, and isAuthenticated false', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should set token, userId, and isAuthenticated to true', () => {
      useAuthStore.getState().login('test-token', 'user-123');

      const state = useAuthStore.getState();
      expect(state.token).toBe('test-token');
      expect(state.userId).toBe('user-123');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should persist token and userId to secure storage', () => {
      useAuthStore.getState().login('test-token', 'user-123');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cadence_auth_token', 'test-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cadence_user_id', 'user-123');
    });
  });

  describe('logout', () => {
    it('should clear token, userId, and set isAuthenticated to false', () => {
      // First login
      useAuthStore.getState().login('test-token', 'user-123');
      // Then logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should remove token and userId from secure storage', () => {
      useAuthStore.getState().logout();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cadence_auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cadence_user_id');
    });
  });

  describe('restoreToken', () => {
    it('should hydrate store when token and userId exist in secure storage', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('stored-token')
        .mockResolvedValueOnce('stored-user-id');

      await useAuthStore.getState().restoreToken();

      const state = useAuthStore.getState();
      expect(state.token).toBe('stored-token');
      expect(state.userId).toBe('stored-user-id');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should not hydrate store when token is missing from secure storage', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('stored-user-id');

      await useAuthStore.getState().restoreToken();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should not hydrate store when userId is missing from secure storage', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('stored-token')
        .mockResolvedValueOnce(null);

      await useAuthStore.getState().restoreToken();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
