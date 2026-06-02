import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
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

const CYCLE_DURATION = 8000; // 4s inhale + 4s exhale = 8s per cycle

export default function BreathingCircle({ duration, elapsedSeconds }: BreathingCircleProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Calculate where in the cycle we should be based on elapsed time
    const elapsedMs = elapsedSeconds * 1000;
    const positionInCycle = elapsedMs % CYCLE_DURATION;
    const halfCycle = CYCLE_DURATION / 2;

    // Determine starting scale based on position in cycle
    if (positionInCycle < halfCycle) {
      // In inhale phase — scale is between 1 and 1.5
      scale.value = 1 + (positionInCycle / halfCycle) * 0.5;
    } else {
      // In exhale phase — scale is between 1.5 and 1
      scale.value = 1.5 - ((positionInCycle - halfCycle) / halfCycle) * 0.5;
    }

    // Start animation from current position
    const remainingInhale = halfCycle - (positionInCycle % halfCycle);

    cancelAnimation(scale);
    scale.value = withRepeat(
      withSequence(
        withTiming(positionInCycle < halfCycle ? 1.5 : 1, {
          duration: remainingInhale,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(positionInCycle < halfCycle ? 1 : 1.5, {
          duration: halfCycle,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(positionInCycle < halfCycle ? 1.5 : 1, {
          duration: halfCycle,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );

    return () => cancelAnimation(scale);
  }, [elapsedSeconds, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.circle, animatedStyle]} />;
}

const styles = StyleSheet.create({
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4a90d9',
    opacity: 0.7,
  },
});
