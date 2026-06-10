import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BreathPattern } from '../types';

interface BreathingSessionViewProps {
  breathPattern: BreathPattern;
  onComplete: () => void;
  paused?: boolean;
}

type BreathPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

function getPhaseLabel(phase: BreathPhase): string {
  switch (phase) {
    case 'inhale': return 'Inhale';
    case 'holdIn': return 'Hold';
    case 'exhale': return 'Exhale';
    case 'holdOut': return 'Hold';
  }
}

function getPhaseDuration(phase: BreathPhase, pattern: BreathPattern): number {
  switch (phase) {
    case 'inhale': return pattern.inhaleSec;
    case 'holdIn': return pattern.holdAfterInhaleSec || 0;
    case 'exhale': return pattern.exhaleSec;
    case 'holdOut': return pattern.holdAfterExhaleSec || 0;
  }
}

function getPhaseSequence(pattern: BreathPattern): BreathPhase[] {
  const seq: BreathPhase[] = ['inhale'];
  if (pattern.holdAfterInhaleSec && pattern.holdAfterInhaleSec > 0) seq.push('holdIn');
  seq.push('exhale');
  if (pattern.holdAfterExhaleSec && pattern.holdAfterExhaleSec > 0) seq.push('holdOut');
  return seq;
}

export default function BreathingSessionView({ breathPattern, onComplete, paused = false }: BreathingSessionViewProps) {
  const [currentCycle, setCurrentCycle] = useState(1);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const scale = useSharedValue(0.6);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef<number>(0);

  const phases = getPhaseSequence(breathPattern);
  const currentPhase = phases[phaseIndex];
  const phaseDuration = getPhaseDuration(currentPhase, breathPattern);

  const advancePhase = useCallback(() => {
    const nextPhaseIndex = phaseIndex + 1;
    if (nextPhaseIndex >= phases.length) {
      // End of cycle
      if (currentCycle >= breathPattern.cycles) {
        onComplete();
        return;
      }
      setCurrentCycle(c => c + 1);
      setPhaseIndex(0);
    } else {
      setPhaseIndex(nextPhaseIndex);
    }
  }, [phaseIndex, phases.length, currentCycle, breathPattern.cycles, onComplete]);

  // Animate circle based on phase
  useEffect(() => {
    if (paused) return;
    const duration = phaseDuration * 1000;
    switch (currentPhase) {
      case 'inhale':
        scale.value = withTiming(1.2, { duration, easing: Easing.inOut(Easing.sin) });
        break;
      case 'exhale':
        scale.value = withTiming(0.6, { duration, easing: Easing.inOut(Easing.sin) });
        break;
      // hold phases: no animation change
    }
  }, [currentPhase, phaseDuration, scale, paused]);

  // Stop interval when paused, preserve state
  useEffect(() => {
    if (paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Resume: use remainingRef (preserved from pause) as the starting point
    const startRemaining = remainingRef.current > 0 ? remainingRef.current : phaseDuration;
    remainingRef.current = startRemaining;
    setCountdown(startRemaining);

    if (startRemaining === 0) {
      advancePhase();
      return;
    }

    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1;
      setCountdown(remainingRef.current);
      if (remainingRef.current <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        advancePhase();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, phaseIndex, currentCycle]);

  // Reset countdown only when phase/cycle actually changes (not on pause toggle)
  const prevPhaseRef = useRef(phaseIndex);
  const prevCycleRef = useRef(currentCycle);
  useEffect(() => {
    if (prevPhaseRef.current !== phaseIndex || prevCycleRef.current !== currentCycle) {
      prevPhaseRef.current = phaseIndex;
      prevCycleRef.current = currentCycle;
      setCountdown(phaseDuration);
      remainingRef.current = phaseDuration;
    }
  }, [phaseIndex, currentCycle, phaseDuration]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.cycleText}>
        {currentCycle} / {breathPattern.cycles}
      </Text>

      <View style={styles.circleContainer}>
        <Animated.View style={[styles.outerRing, circleStyle]} />
        <Animated.View style={[styles.innerCircle, circleStyle]} />
      </View>

      <Text style={styles.phaseLabel}>{getPhaseLabel(currentPhase)}</Text>
      <Text style={styles.countdown}>{countdown}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleText: {
    fontSize: 13,
    color: '#5a6b5e',
    marginBottom: 40,
    letterSpacing: 1,
  },
  circleContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  outerRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(143, 174, 147, 0.35)',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(143, 174, 147, 0.2)',
    borderWidth: 1.5,
    borderColor: '#8fae93',
  },
  phaseLabel: {
    fontSize: 20,
    fontWeight: '300',
    color: '#8fae93',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  countdown: {
    fontSize: 44,
    fontWeight: '200',
    color: '#f0f4f1',
    fontVariant: ['tabular-nums'],
  },
});
