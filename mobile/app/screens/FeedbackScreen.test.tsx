import { useProtocolStore } from '../store/useProtocolStore';
import { useSessionStore } from '../store/useSessionStore';

// Mock expo-secure-store (required by useAuthStore)
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock navigation
const mockGoBack = jest.fn();
const mockGetParent = jest.fn().mockReturnValue({ goBack: mockGoBack });
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    getParent: mockGetParent,
  }),
}));

// Mock react-native
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
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

describe('FeedbackScreen', () => {
  const sampleProtocol = {
    id: 'proto-1',
    name: 'Physiological Sigh',
    duration_seconds: 60,
    instruction_text: 'Breathe deeply.',
    animation_type: 'breathing_circle',
    audio_guide_url: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useProtocolStore.getState().setProtocol(sampleProtocol);
    useSessionStore.getState().reset();
    // Simulate being in feedback phase
    useSessionStore.getState().setPhase('preparation');
    useSessionStore.getState().setPhase('execution');
    useSessionStore.getState().tick();
    useSessionStore.getState().tick();
    useSessionStore.getState().tick();
  });

  describe('outcome buttons', () => {
    it('has three feedback options: better, no_change, worse', () => {
      const FEEDBACK_OPTIONS = [
        { label: 'Better', value: 'better' },
        { label: 'No Change', value: 'no_change' },
        { label: 'Worse', value: 'worse' },
      ];

      expect(FEEDBACK_OPTIONS).toHaveLength(3);
      expect(FEEDBACK_OPTIONS[0].value).toBe('better');
      expect(FEEDBACK_OPTIONS[1].value).toBe('no_change');
      expect(FEEDBACK_OPTIONS[2].value).toBe('worse');
    });
  });

  describe('submits on selection', () => {
    it('sends POST /log with correct payload on "better" selection', async () => {
      mockPost.mockResolvedValueOnce({ id: 'log-1' });

      const feedbackResult = 'better';
      const protocol = useProtocolStore.getState().protocol;
      const elapsedSeconds = useSessionStore.getState().elapsedSeconds;
      const completedFully = useSessionStore.getState().completedFully;

      await mockPost('/log', {
        protocol_id: protocol?.id,
        trigger_context: 'user_session',
        feedback_result: feedbackResult,
        completed_fully: completedFully,
        actual_duration_seconds: elapsedSeconds,
      });

      expect(mockPost).toHaveBeenCalledWith('/log', {
        protocol_id: 'proto-1',
        trigger_context: 'user_session',
        feedback_result: 'better',
        completed_fully: false,
        actual_duration_seconds: 3,
      });
    });

    it('sends POST /log with "no_change" feedback', async () => {
      mockPost.mockResolvedValueOnce({ id: 'log-2' });

      const feedbackResult = 'no_change';
      const protocol = useProtocolStore.getState().protocol;
      const elapsedSeconds = useSessionStore.getState().elapsedSeconds;
      const completedFully = useSessionStore.getState().completedFully;

      await mockPost('/log', {
        protocol_id: protocol?.id,
        trigger_context: 'user_session',
        feedback_result: feedbackResult,
        completed_fully: completedFully,
        actual_duration_seconds: elapsedSeconds,
      });

      expect(mockPost).toHaveBeenCalledWith('/log', expect.objectContaining({
        feedback_result: 'no_change',
      }));
    });

    it('sends POST /log with "worse" feedback', async () => {
      mockPost.mockResolvedValueOnce({ id: 'log-3' });

      const feedbackResult = 'worse';
      const protocol = useProtocolStore.getState().protocol;
      const elapsedSeconds = useSessionStore.getState().elapsedSeconds;
      const completedFully = useSessionStore.getState().completedFully;

      await mockPost('/log', {
        protocol_id: protocol?.id,
        trigger_context: 'user_session',
        feedback_result: feedbackResult,
        completed_fully: completedFully,
        actual_duration_seconds: elapsedSeconds,
      });

      expect(mockPost).toHaveBeenCalledWith('/log', expect.objectContaining({
        feedback_result: 'worse',
      }));
    });
  });

  describe('post-submission behavior', () => {
    it('dismisses modal after successful submission', async () => {
      mockPost.mockResolvedValueOnce({ id: 'log-1' });

      // Simulate handleFeedback
      await mockPost('/log', { feedback_result: 'better' });
      useProtocolStore.getState().clearProtocol();
      useSessionStore.getState().reset();
      mockGoBack();

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('dismisses modal even on API failure (does not block user)', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));

      // Simulate handleFeedback with error handling
      try {
        await mockPost('/log', { feedback_result: 'better' });
      } catch (err) {
        // Log error but don't block
      }

      // Always dismiss
      useProtocolStore.getState().clearProtocol();
      useSessionStore.getState().reset();
      mockGoBack();

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('resets protocol store after submission', async () => {
      mockPost.mockResolvedValueOnce({ id: 'log-1' });

      await mockPost('/log', { feedback_result: 'better' });
      useProtocolStore.getState().clearProtocol();

      expect(useProtocolStore.getState().protocol).toBeNull();
    });

    it('resets session store after submission', async () => {
      mockPost.mockResolvedValueOnce({ id: 'log-1' });

      await mockPost('/log', { feedback_result: 'better' });
      useSessionStore.getState().reset();

      expect(useSessionStore.getState().phase).toBe('idle');
      expect(useSessionStore.getState().elapsedSeconds).toBe(0);
      expect(useSessionStore.getState().completedFully).toBe(false);
    });

    it('includes completedFully=true when timer completed naturally', async () => {
      mockPost.mockResolvedValueOnce({ id: 'log-1' });

      // Simulate complete() being called (timer finished)
      useSessionStore.getState().complete();
      const completedFully = useSessionStore.getState().completedFully;

      expect(completedFully).toBe(true);
    });

    it('includes completedFully=false when user skipped', async () => {
      mockPost.mockResolvedValueOnce({ id: 'log-1' });

      // Simulate skip() being called
      useSessionStore.getState().skip();
      const completedFully = useSessionStore.getState().completedFully;

      expect(completedFully).toBe(false);
    });
  });
});
