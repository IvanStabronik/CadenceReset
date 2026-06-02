import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface BoxSquareProps {
  duration: number;
  elapsedSeconds: number;
}

// Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s = 16s cycle
const PHASE_DURATION = 4000;
const CYCLE_DURATION = PHASE_DURATION * 4; // 16s

export default function BoxSquare({ duration, elapsedSeconds }: BoxSquareProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Sync progress to elapsed time
    const elapsedMs = elapsedSeconds * 1000;
    const positionInCycle = (elapsedMs % CYCLE_DURATION) / CYCLE_DURATION;
    progress.value = positionInCycle;

    // Calculate remaining time in current phase to resume smoothly
    const phaseProgress = (positionInCycle * 4) % 1; // 0-1 within current phase
    const remainingPhaseMs = (1 - phaseProgress) * PHASE_DURATION;
    const currentPhaseTarget = (Math.floor(positionInCycle * 4) + 1) / 4;

    cancelAnimation(progress);
    progress.value = withRepeat(
      withSequence(
        withTiming(currentPhaseTarget, { duration: remainingPhaseMs, easing: Easing.linear }),
        ...Array.from({ length: 3 }, (_, i) => {
          const target = ((Math.floor(positionInCycle * 4) + 2 + i) % 4 + 1) / 4;
          return withTiming(target > 1 ? target - 1 : target, { duration: PHASE_DURATION, easing: Easing.linear });
        }),
      ),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [elapsedSeconds, progress]);

  const dotStyle = useAnimatedStyle(() => {
    const p = progress.value % 1;
    let translateX = 0;
    let translateY = 0;
    const size = 120;

    if (p < 0.25) {
      translateX = (p / 0.25) * size;
      translateY = 0;
    } else if (p < 0.5) {
      translateX = size;
      translateY = ((p - 0.25) / 0.25) * size;
    } else if (p < 0.75) {
      translateX = size - ((p - 0.5) / 0.25) * size;
      translateY = size;
    } else {
      translateX = 0;
      translateY = size - ((p - 0.75) / 0.25) * size;
    }

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.square} />
      <Animated.View style={[styles.dot, dotStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 140,
    position: 'relative',
  },
  square: {
    width: 120,
    height: 120,
    borderWidth: 3,
    borderColor: '#4a90d9',
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    left: 10,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#27ae60',
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
