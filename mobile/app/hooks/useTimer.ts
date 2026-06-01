import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSessionStore } from '../store/useSessionStore';

interface UseTimerOptions {
  duration: number;
  onComplete: () => void;
}

export function useTimer({ duration, onComplete }: UseTimerOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const tick = useSessionStore((state) => state.tick);
  const elapsedSeconds = useSessionStore((state) => state.elapsedSeconds);

  const getRemainingSeconds = useCallback(() => {
    return Math.max(0, duration - elapsedSeconds);
  }, [duration, elapsedSeconds]);

  useEffect(() => {
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = useSessionStore.getState().elapsedSeconds;
      if (elapsed >= duration - 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        tick();
        onComplete();
      } else {
        tick();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [duration, onComplete, tick]);

  // AppState listener for background/foreground tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground — calculate time delta
        const now = Date.now();
        const elapsedMs = now - startTimeRef.current;
        const totalElapsed = Math.floor(elapsedMs / 1000);
        const currentElapsed = useSessionStore.getState().elapsedSeconds;
        const delta = totalElapsed - currentElapsed;

        if (delta > 0) {
          // Fast-forward the elapsed seconds
          for (let i = 0; i < delta && currentElapsed + i < duration; i++) {
            tick();
          }

          // Check if timer completed while backgrounded
          if (totalElapsed >= duration) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onComplete();
          }
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [duration, onComplete, tick]);

  return {
    remainingSeconds: getRemainingSeconds(),
    elapsedSeconds,
  };
}
