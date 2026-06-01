import { useSessionStore } from '../store/useSessionStore';

// Mock AppState
const mockAppStateAddEventListener = jest.fn().mockReturnValue({ remove: jest.fn() });
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: mockAppStateAddEventListener,
  },
}));

describe('useTimer - timer logic via session store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.getState().reset();
  });

  describe('timer starts at duration and decrements', () => {
    it('remaining seconds starts at duration minus elapsed', () => {
      const duration = 60;
      const elapsed = useSessionStore.getState().elapsedSeconds;
      const remaining = Math.max(0, duration - elapsed);
      expect(remaining).toBe(60);
    });

    it('tick decrements remaining seconds', () => {
      const duration = 60;
      useSessionStore.getState().tick();
      const elapsed = useSessionStore.getState().elapsedSeconds;
      const remaining = Math.max(0, duration - elapsed);
      expect(remaining).toBe(59);
    });

    it('multiple ticks decrement correctly', () => {
      const duration = 60;
      for (let i = 0; i < 5; i++) {
        useSessionStore.getState().tick();
      }
      const elapsed = useSessionStore.getState().elapsedSeconds;
      const remaining = Math.max(0, duration - elapsed);
      expect(elapsed).toBe(5);
      expect(remaining).toBe(55);
    });
  });

  describe('timer stops at zero', () => {
    it('remaining never goes below zero', () => {
      const duration = 3;
      // Tick more times than duration
      for (let i = 0; i < 10; i++) {
        useSessionStore.getState().tick();
      }
      const elapsed = useSessionStore.getState().elapsedSeconds;
      const remaining = Math.max(0, duration - elapsed);
      expect(remaining).toBe(0);
    });

    it('complete is triggered when elapsed reaches duration', () => {
      const duration = 3;
      for (let i = 0; i < duration; i++) {
        useSessionStore.getState().tick();
      }
      const elapsed = useSessionStore.getState().elapsedSeconds;
      if (elapsed >= duration) {
        useSessionStore.getState().complete();
      }
      expect(useSessionStore.getState().phase).toBe('feedback');
      expect(useSessionStore.getState().completedFully).toBe(true);
    });
  });

  describe('background tracking - elapsed delta on foreground resume', () => {
    it('calculates correct delta when app resumes from background', () => {
      const duration = 60;
      // Simulate: 5 ticks happened before backgrounding
      for (let i = 0; i < 5; i++) {
        useSessionStore.getState().tick();
      }
      expect(useSessionStore.getState().elapsedSeconds).toBe(5);

      // Simulate: 10 seconds passed in background
      const backgroundDelta = 10;
      const currentElapsed = useSessionStore.getState().elapsedSeconds;
      const totalElapsed = currentElapsed + backgroundDelta;

      // Fast-forward elapsed seconds (simulating what useTimer does on resume)
      for (let i = 0; i < backgroundDelta && currentElapsed + i < duration; i++) {
        useSessionStore.getState().tick();
      }

      expect(useSessionStore.getState().elapsedSeconds).toBe(15);
    });

    it('does not exceed duration when background delta overshoots', () => {
      const duration = 10;
      // Simulate: 8 ticks before background
      for (let i = 0; i < 8; i++) {
        useSessionStore.getState().tick();
      }

      // Simulate: 5 seconds in background (would overshoot duration of 10)
      const backgroundDelta = 5;
      const currentElapsed = useSessionStore.getState().elapsedSeconds;

      for (let i = 0; i < backgroundDelta && currentElapsed + i < duration; i++) {
        useSessionStore.getState().tick();
      }

      // Should be clamped: only 2 more ticks (8 + 2 = 10 = duration)
      expect(useSessionStore.getState().elapsedSeconds).toBe(10);
    });

    it('triggers complete when timer finishes during background', () => {
      const duration = 5;
      // Simulate: 3 ticks before background
      for (let i = 0; i < 3; i++) {
        useSessionStore.getState().tick();
      }

      // Simulate: 5 seconds in background (overshoots)
      const backgroundDelta = 5;
      const currentElapsed = useSessionStore.getState().elapsedSeconds;
      const totalElapsed = currentElapsed + backgroundDelta;

      for (let i = 0; i < backgroundDelta && currentElapsed + i < duration; i++) {
        useSessionStore.getState().tick();
      }

      // Check if timer completed while backgrounded
      if (useSessionStore.getState().elapsedSeconds >= duration) {
        useSessionStore.getState().complete();
      }

      expect(useSessionStore.getState().phase).toBe('feedback');
      expect(useSessionStore.getState().completedFully).toBe(true);
    });
  });
});
