import { create } from 'zustand';
import { SessionPhase, SessionState } from '../types';

const PHASE_ORDER: SessionPhase[] = ['idle', 'preparation', 'execution', 'feedback'];

export const useSessionStore = create<SessionState>((set) => ({
  phase: 'idle',
  elapsedSeconds: 0,
  durationSeconds: 0,
  completedFully: false,
  triggerContext: null,

  setPhase: (phase: SessionPhase) => {
    set((state) => {
      const currentIndex = PHASE_ORDER.indexOf(state.phase);
      const nextIndex = PHASE_ORDER.indexOf(phase);
      if (nextIndex === currentIndex + 1 || (state.phase === 'feedback' && phase === 'idle')) {
        return { phase };
      }
      return state;
    });
  },

  setDuration: (duration: number) => {
    set({ durationSeconds: duration });
  },

  tick: () => {
    set((state) => {
      if (state.durationSeconds > 0 && state.elapsedSeconds >= state.durationSeconds) {
        return state; // Clamped — don't exceed duration
      }
      return { elapsedSeconds: state.elapsedSeconds + 1 };
    });
  },

  complete: () => {
    set({ completedFully: true, phase: 'feedback' });
  },

  skip: () => {
    set({ completedFully: false, phase: 'feedback' });
  },

  reset: () => {
    set({ phase: 'idle', elapsedSeconds: 0, durationSeconds: 0, completedFully: false, triggerContext: null });
  },

  setTriggerContext: (value: string) => {
    set({ triggerContext: value });
  },
}));
