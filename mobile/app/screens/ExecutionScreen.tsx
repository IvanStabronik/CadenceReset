import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSessionStore } from '../store/useSessionStore';
import { useProtocolStore } from '../store/useProtocolStore';
import { useTimer } from '../hooks/useTimer';
import BreathingCircle from '../animations/BreathingCircle';
import BoxSquare from '../animations/BoxSquare';
import { InterventionFlowParamList } from '../navigation/InterventionFlowNavigator';

type ExecutionNavigationProp = NativeStackNavigationProp<InterventionFlowParamList, 'Execution'>;

export default function ExecutionScreen() {
  const navigation = useNavigation<ExecutionNavigationProp>();
  const phase = useSessionStore((state) => state.phase);
  const complete = useSessionStore((state) => state.complete);
  const skip = useSessionStore((state) => state.skip);
  const setDuration = useSessionStore((state) => state.setDuration);
  const elapsedSeconds = useSessionStore((state) => state.elapsedSeconds);
  const protocol = useProtocolStore((state) => state.protocol);

  const duration = protocol?.duration_seconds ?? 60;

  useEffect(() => {
    setDuration(duration);
  }, [duration, setDuration]);

  const handleComplete = useCallback(() => {
    complete();
    navigation.navigate('Feedback');
  }, [complete, navigation]);

  const { remainingSeconds } = useTimer({
    duration,
    onComplete: handleComplete,
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (phase === 'execution') {
        e.preventDefault();
      }
    });
    return unsubscribe;
  }, [navigation, phase]);

  const handleSkip = () => {
    skip();
    navigation.navigate('Feedback');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAnimation = () => {
    if (!protocol) return null;
    switch (protocol.animation_type) {
      case 'breathing_circle':
        return <BreathingCircle duration={duration} elapsedSeconds={elapsedSeconds} />;
      case 'box_square':
        return <BoxSquare duration={duration} elapsedSeconds={elapsedSeconds} />;
      default:
        return <BreathingCircle duration={duration} elapsedSeconds={elapsedSeconds} />;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(remainingSeconds)}</Text>

      <View style={styles.animationContainer}>
        {renderAnimation()}
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.6}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050706',
    padding: 28,
  },
  timer: {
    fontSize: 44,
    fontWeight: '200',
    color: '#f0f4f1',
    marginBottom: 48,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  animationContainer: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 56,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(143, 174, 147, 0.25)',
  },
  skipText: {
    color: '#5a6b5e',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 1,
  },
});
