import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface BreathingCircleProps {
  duration: number;
}

export default function BreathingCircle({ duration }: BreathingCircleProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    // 4s inhale (expand) + 4s exhale (contract) = 8s cycle
    const cycleDuration = 4000;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: cycleDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: cycleDuration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // infinite repeat
      false,
    );
  }, [scale]);

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
