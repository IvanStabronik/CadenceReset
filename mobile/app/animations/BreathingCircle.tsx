import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface BreathingCircleProps {
  duration: number;
  elapsedSeconds: number;
}

const INHALE_MS = 4000;
const EXHALE_MS = 4000;
const CYCLE_MS = INHALE_MS + EXHALE_MS;

export default function BreathingCircle({ duration, elapsedSeconds }: BreathingCircleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    // 0 → 1 = inhale (expand), 1 → 0 = exhale (contract)
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: INHALE_MS, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: EXHALE_MS, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + progress.value * 0.4 }],
    opacity: 0.2 + progress.value * 0.15,
  }));

  const middleRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + progress.value * 0.5 }],
    opacity: 0.3 + progress.value * 0.3,
  }));

  const innerCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + progress.value * 0.6 }],
    opacity: 0.7 + progress.value * 0.3,
  }));

  // Phase text
  const phaseMs = (elapsedSeconds * 1000) % CYCLE_MS;
  const phaseText = phaseMs < INHALE_MS ? 'Inhale' : 'Exhale';

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Animated.View style={[styles.outerRing, outerRingStyle]} />
        <Animated.View style={[styles.middleRing, middleRingStyle]} />
        <Animated.View style={[styles.innerCircle, innerCircleStyle]} />
      </View>
      <Text style={styles.phaseText}>{phaseText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#8fae93',
  },
  middleRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(143, 174, 147, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(143, 174, 147, 0.4)',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8fae93',
  },
  phaseText: {
    marginTop: 32,
    fontSize: 16,
    fontWeight: '300',
    color: '#8a9b8e',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
