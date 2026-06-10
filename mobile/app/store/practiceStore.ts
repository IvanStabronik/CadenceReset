import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PracticeSession, CheckInScores, UserState } from '../features/practices/types';

interface PracticeStoreState {
  sessions: PracticeSession[];
  currentSession: PracticeSession | null;
  favoritePracticeIds: string[];
  startSession: (practiceId: string, userState?: UserState) => void;
  setBeforeScores: (scores: CheckInScores) => void;
  completeSession: (after: CheckInScores, shift: 'better' | 'same' | 'worse', wouldUseAgain: 'yes' | 'maybe' | 'no') => void;
  completeWithoutFeedback: () => void;
  abandonSession: () => void;
  resetCurrentSession: () => void;
  toggleFavorite: (practiceId: string) => void;
  getRecentSessions: (count?: number) => PracticeSession[];
  getCompletedSessions: () => PracticeSession[];
  getLatestCompletedSession: () => PracticeSession | undefined;
}

export const usePracticeStore = create<PracticeStoreState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      favoritePracticeIds: [],

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

      completeWithoutFeedback: () => {
        const current = get().currentSession;
        if (!current) return;
        const completed: PracticeSession = {
          ...current,
          completedAt: new Date().toISOString(),
          completed: true,
          feedbackSkipped: true,
        };
        set((state) => ({
          sessions: [...state.sessions, completed],
          currentSession: null,
        }));
      },

      resetCurrentSession: () => set({ currentSession: null }),

      toggleFavorite: (practiceId) => {
        set((state) => {
          const ids = state.favoritePracticeIds;
          if (ids.includes(practiceId)) {
            return { favoritePracticeIds: ids.filter(id => id !== practiceId) };
          }
          return { favoritePracticeIds: [...ids, practiceId] };
        });
      },

      getRecentSessions: (count = 5) => {
        const { sessions } = get();
        return [...sessions].reverse().slice(0, count);
      },

      getCompletedSessions: () => {
        return get().sessions.filter(s => s.completed);
      },

      getLatestCompletedSession: () => {
        const sessions = get().sessions;
        for (let i = sessions.length - 1; i >= 0; i--) {
          if (sessions[i].completed) return sessions[i];
        }
        return undefined;
      },
    }),
    {
      name: 'cadence-practice-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        favoritePracticeIds: state.favoritePracticeIds,
        // Do not persist currentSession — it's transient
      }),
    },
  ),
);
