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

  // Set duration in store so tick() can clamp
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

  // Back-navigation prevention during execution
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
        return <BreathingCircle duration={duration} />;
      case 'box_square':
        return <BoxSquare duration={duration} />;
      default:
        return <BreathingCircle duration={duration} />;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(remainingSeconds)}</Text>

      <View style={styles.animationContainer}>
        {renderAnimation()}
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
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
    backgroundColor: '#1a1a2e',
    padding: 24,
  },
  timer: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
    marginBottom: 48,
  },
  animationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
});
