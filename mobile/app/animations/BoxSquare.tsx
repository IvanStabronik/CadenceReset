import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface BoxSquareProps {
  duration: number;
}

export default function BoxSquare({ duration }: BoxSquareProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // 4 phases of 4s each = 16s cycle (inhale, hold, exhale, hold)
    const phaseDuration = 4000;
    progress.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: phaseDuration, easing: Easing.linear }),
        withTiming(0.5, { duration: phaseDuration, easing: Easing.linear }),
        withTiming(0.75, { duration: phaseDuration, easing: Easing.linear }),
        withTiming(1, { duration: phaseDuration, easing: Easing.linear }),
      ),
      -1,
      false,
    );
  }, [progress]);

  const dotStyle = useAnimatedStyle(() => {
    const p = progress.value % 1;
    let translateX = 0;
    let translateY = 0;
    const size = 120;

    if (p < 0.25) {
      // Top edge: left to right
      translateX = (p / 0.25) * size;
      translateY = 0;
    } else if (p < 0.5) {
      // Right edge: top to bottom
      translateX = size;
      translateY = ((p - 0.25) / 0.25) * size;
    } else if (p < 0.75) {
      // Bottom edge: right to left
      translateX = size - ((p - 0.5) / 0.25) * size;
      translateY = size;
    } else {
      // Left edge: bottom to top
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
