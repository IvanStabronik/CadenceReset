import { useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';

interface UseVoiceGuidanceOptions {
  enabled: boolean;
  text?: string;
  paused: boolean;
  rate?: number;
  delaySec?: number;
}

/**
 * Speaks the given text when enabled and not paused.
 * Stops speech on pause, unmount, or text change.
 * Does NOT use Speech.pause/resume (unsupported on Android).
 */
export function useVoiceGuidance({
  enabled,
  text,
  paused,
  rate = 0.85,
  delaySec = 0,
}: UseVoiceGuidanceOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !text || paused) {
      Speech.stop();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    Speech.stop();

    const speak = () => {
      Speech.speak(text, {
        language: 'en-US',
        rate,
        pitch: 1.0,
      });
    };

    if (delaySec > 0) {
      timeoutRef.current = setTimeout(speak, delaySec * 1000);
    } else {
      speak();
    }

    return () => {
      Speech.stop();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, text, paused, rate, delaySec]);
}

/**
 * Speaks a short breath phase cue (e.g. "Inhale", "Exhale", "Hold").
 * Only speaks for the first N cycles to avoid being annoying.
 */
export function useBreathVoiceGuidance({
  enabled,
  phaseLabel,
  cycle,
  paused,
  maxVoiceCycles = 3,
}: {
  enabled: boolean;
  phaseLabel: string;
  cycle: number;
  paused: boolean;
  maxVoiceCycles?: number;
}) {
  useEffect(() => {
    if (!enabled || paused || cycle > maxVoiceCycles) {
      return;
    }

    Speech.stop();
    Speech.speak(phaseLabel, {
      language: 'en-US',
      rate: 0.8,
      pitch: 1.0,
    });

    return () => {
      Speech.stop();
    };
  }, [enabled, phaseLabel, cycle, paused, maxVoiceCycles]);
}
