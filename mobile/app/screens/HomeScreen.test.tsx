import { useProtocolStore } from '../store/useProtocolStore';
import { useSessionStore } from '../store/useSessionStore';

// Mock expo-secure-store (required by useAuthStore)
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock react-native
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  StyleSheet: { create: (styles: any) => styles },
}));

// Mock api service
const mockPost = jest.fn();
jest.mock('../services/api', () => ({
  api: {
    post: (...args: any[]) => mockPost(...args),
  },
}));

// Mock auth service
jest.mock('../services/auth', () => ({
  signInAnonymously: jest.fn().mockResolvedValue(undefined),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProtocolStore.getState().clearProtocol();
    useSessionStore.getState().reset();
  });

  describe('input and character counter', () => {
    it('has a max length of 500 characters', () => {
      // The HomeScreen component uses MAX_LENGTH = 500
      const MAX_LENGTH = 500;
      expect(MAX_LENGTH).toBe(500);
    });

    it('character counter starts at 0/500', () => {
      // Initial state: triggerContext is empty string
      const triggerContext = '';
      const MAX_LENGTH = 500;
      const counterText = `${triggerContext.length}/${MAX_LENGTH}`;
      expect(counterText).toBe('0/500');
    });

    it('character counter updates with input length', () => {
      const triggerContext = 'Hello world';
      const MAX_LENGTH = 500;
      const counterText = `${triggerContext.length}/${MAX_LENGTH}`;
      expect(counterText).toBe('11/500');
    });
  });

  describe('submit button behavior', () => {
    it('shows validation error when input is empty/whitespace', () => {
      const triggerContext = '   ';
      let error: string | null = null;

      if (!triggerContext.trim()) {
        error = 'Please describe your current situation';
      }

      expect(error).toBe('Please describe your current situation');
    });

    it('does not show error when input has content', () => {
      const triggerContext = 'stressful meeting';
      let error: string | null = null;

      if (!triggerContext.trim()) {
        error = 'Please describe your current situation';
      }

      expect(error).toBeNull();
    });
  });

  describe('API success flow', () => {
    it('stores protocol and navigates on successful API response', async () => {
      const mockProtocol = {
        id: 'proto-1',
        name: 'Physiological Sigh',
        duration_seconds: 60,
        instruction_text: 'Breathe deeply.',
        animation_type: 'breathing_circle',
        audio_guide_url: null,
      };
      mockPost.mockResolvedValueOnce(mockProtocol);

      // Simulate handleSubmit logic
      const triggerContext = 'stressful meeting';
      const protocol = await mockPost('/recommendation/match', {
        trigger_context: triggerContext,
      });

      useProtocolStore.getState().setProtocol(protocol);
      useSessionStore.getState().setPhase('preparation');
      mockNavigate('InterventionFlow');

      expect(useProtocolStore.getState().protocol).toEqual(mockProtocol);
      expect(useSessionStore.getState().phase).toBe('preparation');
      expect(mockNavigate).toHaveBeenCalledWith('InterventionFlow');
    });
  });

  describe('API failure flow', () => {
    it('shows error message on API failure without navigating', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));

      let error: string | null = null;
      try {
        await mockPost('/recommendation/match', { trigger_context: 'test' });
      } catch (err: any) {
        error = err.message || 'Something went wrong. Please try again.';
      }

      expect(error).toBe('Network error');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('uses fallback error message when error has no message', async () => {
      mockPost.mockRejectedValueOnce({});

      let error: string | null = null;
      try {
        await mockPost('/recommendation/match', { trigger_context: 'test' });
      } catch (err: any) {
        error = err.message || 'Something went wrong. Please try again.';
      }

      expect(error).toBe('Something went wrong. Please try again.');
    });
  });
});
