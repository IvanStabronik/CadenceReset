import { useAuthStore } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      userId: null,
      isAuthenticated: false,
    });
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
  });

  describe('logout', () => {
    it('should clear token, userId, and set isAuthenticated to false', () => {
      useAuthStore.getState().login('test-token', 'user-123');
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('restoreToken', () => {
    it('should be a no-op (session restoration handled by Supabase client)', async () => {
      await useAuthStore.getState().restoreToken();

      // State should remain unchanged — restoreToken is a no-op
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
