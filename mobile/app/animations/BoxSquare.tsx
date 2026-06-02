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

interface BoxSquareProps {
  duration: number;
  elapsedSeconds: number;
}

const PHASE_MS = 4000;
const CYCLE_MS = PHASE_MS * 4;
const PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold'];

export default function BoxSquare({ duration, elapsedSeconds }: BoxSquareProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: PHASE_MS, easing: Easing.linear }),
        withTiming(0.5, { duration: PHASE_MS, easing: Easing.linear }),
        withTiming(0.75, { duration: PHASE_MS, easing: Easing.linear }),
        withTiming(1, { duration: PHASE_MS, easing: Easing.linear }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const SIZE = 160;
  const DOT_SIZE = 18;

  const dotStyle = useAnimatedStyle(() => {
    const p = progress.value % 1;
    let translateX = 0;
    let translateY = 0;

    if (p < 0.25) {
      translateX = (p / 0.25) * SIZE;
      translateY = 0;
    } else if (p < 0.5) {
      translateX = SIZE;
      translateY = ((p - 0.25) / 0.25) * SIZE;
    } else if (p < 0.75) {
      translateX = SIZE - ((p - 0.5) / 0.25) * SIZE;
      translateY = SIZE;
    } else {
      translateX = 0;
      translateY = SIZE - ((p - 0.75) / 0.25) * SIZE;
    }

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  // Determine current phase text
  const phaseIndex = Math.floor(((elapsedSeconds * 1000) % CYCLE_MS) / PHASE_MS);
  const phaseText = PHASES[phaseIndex] || 'Inhale';

  return (
    <View style={styles.container}>
      <View style={[styles.squareContainer, { width: SIZE + DOT_SIZE, height: SIZE + DOT_SIZE }]}>
        {/* Corner labels */}
        <Text style={[styles.cornerLabel, styles.topLeft]}>Inhale</Text>
        <Text style={[styles.cornerLabel, styles.topRight]}>Hold</Text>
        <Text style={[styles.cornerLabel, styles.bottomRight]}>Exhale</Text>
        <Text style={[styles.cornerLabel, styles.bottomLeft]}>Hold</Text>

        {/* Square path */}
        <View style={[styles.square, { width: SIZE, height: SIZE, top: DOT_SIZE / 2, left: DOT_SIZE / 2 }]} />

        {/* Moving dot */}
        <Animated.View style={[styles.dot, { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 }, dotStyle]} />
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
  squareContainer: {
    position: 'relative',
  },
  square: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(143, 174, 147, 0.4)',
    borderRadius: 12,
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#8fae93',
    shadowColor: '#8fae93',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  cornerLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#5a6b5e',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  topLeft: { top: -16, left: 9 },
  topRight: { top: -16, right: 9 },
  bottomRight: { bottom: -16, right: 9 },
  bottomLeft: { bottom: -16, left: 9 },
  phaseText: {
    marginTop: 36,
    fontSize: 16,
    fontWeight: '300',
    color: '#8a9b8e',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
