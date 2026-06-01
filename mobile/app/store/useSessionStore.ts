import { create } from 'zustand';
import { SessionPhase, SessionState } from '../types';

const PHASE_ORDER: SessionPhase[] = ['idle', 'preparation', 'execution', 'feedback'];

export const useSessionStore = create<SessionState>((set) => ({
  phase: 'idle',
  elapsedSeconds: 0,
  completedFully: false,

  setPhase: (phase: SessionPhase) => {
    set((state) => {
      const currentIndex = PHASE_ORDER.indexOf(state.phase);
      const nextIndex = PHASE_ORDER.indexOf(phase);
      // Allow only sequential transitions (next phase) or reset to idle from feedback
      if (nextIndex === currentIndex + 1 || (state.phase === 'feedback' && phase === 'idle')) {
        return { phase };
      }
      return state; // Reject invalid transitions
    });
  },

  tick: () => {
    set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
  },

  complete: () => {
    set({ completedFully: true, phase: 'feedback' });
  },

  skip: () => {
    set({ completedFully: false, phase: 'feedback' });
  },

  reset: () => {
    set({ phase: 'idle', elapsedSeconds: 0, completedFully: false });
  },
}));
