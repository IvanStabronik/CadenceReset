import { useSessionStore } from './useSessionStore';

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have default values', () => {
      const state = useSessionStore.getState();
      expect(state.phase).toBe('idle');
      expect(state.elapsedSeconds).toBe(0);
      expect(state.completedFully).toBe(false);
    });
  });

  describe('setPhase', () => {
    it('should transition from idle to preparation', () => {
      useSessionStore.getState().setPhase('preparation');
      expect(useSessionStore.getState().phase).toBe('preparation');
    });

    it('should transition from preparation to execution', () => {
      useSessionStore.getState().setPhase('preparation');
      useSessionStore.getState().setPhase('execution');
      expect(useSessionStore.getState().phase).toBe('execution');
    });

    it('should transition from execution to feedback', () => {
      useSessionStore.getState().setPhase('preparation');
      useSessionStore.getState().setPhase('execution');
      useSessionStore.getState().setPhase('feedback');
      expect(useSessionStore.getState().phase).toBe('feedback');
    });

    it('should transition from feedback to idle', () => {
      useSessionStore.getState().setPhase('preparation');
      useSessionStore.getState().setPhase('execution');
      useSessionStore.getState().setPhase('feedback');
      useSessionStore.getState().setPhase('idle');
      expect(useSessionStore.getState().phase).toBe('idle');
    });

    it('should reject non-sequential transitions (idle to execution)', () => {
      useSessionStore.getState().setPhase('execution');
      expect(useSessionStore.getState().phase).toBe('idle');
    });

    it('should reject non-sequential transitions (idle to feedback)', () => {
      useSessionStore.getState().setPhase('feedback');
      expect(useSessionStore.getState().phase).toBe('idle');
    });

    it('should reject backward transitions (execution to preparation)', () => {
      useSessionStore.getState().setPhase('preparation');
      useSessionStore.getState().setPhase('execution');
      useSessionStore.getState().setPhase('preparation');
      expect(useSessionStore.getState().phase).toBe('execution');
    });
  });

  describe('tick', () => {
    it('should increment elapsedSeconds by 1', () => {
      useSessionStore.getState().tick();
      expect(useSessionStore.getState().elapsedSeconds).toBe(1);
    });

    it('should increment multiple times', () => {
      useSessionStore.getState().tick();
      useSessionStore.getState().tick();
      useSessionStore.getState().tick();
      expect(useSessionStore.getState().elapsedSeconds).toBe(3);
    });
  });

  describe('complete', () => {
    it('should set completedFully to true and phase to feedback', () => {
      useSessionStore.getState().complete();
      const state = useSessionStore.getState();
      expect(state.completedFully).toBe(true);
      expect(state.phase).toBe('feedback');
    });
  });

  describe('skip', () => {
    it('should set completedFully to false and phase to feedback', () => {
      useSessionStore.getState().skip();
      const state = useSessionStore.getState();
      expect(state.completedFully).toBe(false);
      expect(state.phase).toBe('feedback');
    });
  });

  describe('reset', () => {
    it('should return all state to defaults', () => {
      // Modify state first
      useSessionStore.getState().setPhase('preparation');
      useSessionStore.getState().tick();
      useSessionStore.getState().tick();

      // Reset
      useSessionStore.getState().reset();
      const state = useSessionStore.getState();
      expect(state.phase).toBe('idle');
      expect(state.elapsedSeconds).toBe(0);
      expect(state.completedFully).toBe(false);
    });
  });
});
