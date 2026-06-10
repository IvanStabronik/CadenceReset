import { create } from 'zustand';
import { PracticeSession, CheckInScores, UserState } from '../features/practices/types';

interface PracticeStoreState {
  sessions: PracticeSession[];
  currentSession: PracticeSession | null;
  startSession: (practiceId: string, userState?: UserState) => void;
  setBeforeScores: (scores: CheckInScores) => void;
  completeSession: (after: CheckInScores, shift: 'better' | 'same' | 'worse', wouldUseAgain: 'yes' | 'maybe' | 'no') => void;
  abandonSession: () => void;
  resetCurrentSession: () => void;
}

export const usePracticeStore = create<PracticeStoreState>((set, get) => ({
  sessions: [],
  currentSession: null,

  startSession: (practiceId, userState) => {
    set({
      currentSession: {
        practiceId,
        startedAt: new Date().toISOString(),
        completed: false,
        userState,
      },
    });
  },

  setBeforeScores: (scores) => {
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, before: scores }
        : null,
    }));
  },

  completeSession: (after, shift, wouldUseAgain) => {
    const current = get().currentSession;
    if (!current) return;

    const reliefDelta: CheckInScores | undefined = current.before
      ? {
          stress: current.before.stress - after.stress,
          bodyTension: current.before.bodyTension - after.bodyTension,
          mentalNoise: current.before.mentalNoise - after.mentalNoise,
        }
      : undefined;

    const completed: PracticeSession = {
      ...current,
      completedAt: new Date().toISOString(),
      completed: true,
      after,
      reliefDelta,
      feedbackShift: shift,
      wouldUseAgain,
    };

    set((state) => ({
      sessions: [...state.sessions, completed],
      currentSession: null,
    }));
  },

  abandonSession: () => {
    const current = get().currentSession;
    if (current) {
      set((state) => ({
        sessions: [...state.sessions, { ...current, completed: false }],
        currentSession: null,
      }));
    }
  },

  resetCurrentSession: () => set({ currentSession: null }),
}));
