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
import { PracticeStep, PracticePhase } from '../types';

interface PracticeStepViewProps {
  step: PracticeStep;
  timeRemaining: number;
}

const BREATH_PHASES: PracticePhase[] = ['inhale', 'exhale', 'hold', 'pause'];

function isBreathPhase(phase?: PracticePhase): boolean {
  return phase != null && BREATH_PHASES.includes(phase);
}

function getPhaseLabel(phase?: PracticePhase): string {
  switch (phase) {
    case 'inhale': return 'Inhale';
    case 'exhale': return 'Exhale';
    case 'hold': return 'Hold';
    case 'pause': return 'Pause';
    default: return '';
  }
}

function BreathingAnimation({ phase }: { phase: PracticePhase }) {
  const progress = useSharedValue(phase === 'exhale' ? 1 : 0);

  useEffect(() => {
    cancelAnimation(progress);

    if (phase === 'inhale') {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else if (phase === 'exhale') {
      progress.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    } else if (phase === 'hold' || phase === 'pause') {
      progress.value = withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.sin) });
    }

    return () => cancelAnimation(progress);
  }, [phase, progress]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
    opacity: 0.2 + progress.value * 0.2,
  }));

  const middleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.5 + progress.value * 0.5 }],
    opacity: 0.3 + progress.value * 0.3,
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + progress.value * 0.6 }],
    opacity: 0.6 + progress.value * 0.4,
  }));

  return (
    <View style={breathStyles.container}>
      <Animated.View style={[breathStyles.outerRing, outerStyle]} />
      <Animated.View style={[breathStyles.middleRing, middleStyle]} />
      <Animated.View style={[breathStyles.innerCircle, innerStyle]} />
      <Text style={breathStyles.phaseLabel}>{getPhaseLabel(phase)}</Text>
    </View>
  );
}

export default function PracticeStepView({ step, timeRemaining }: PracticeStepViewProps) {
  const showBreathAnimation = isBreathPhase(step.phase);

  return (
    <View style={styles.container}>
      {showBreathAnimation && step.phase && (
        <BreathingAnimation phase={step.phase} />
      )}

      {!showBreathAnimation && (
        <View style={styles.instructionCard}>
          {step.title && <Text style={styles.stepTitle}>{step.title}</Text>}
          <Text style={styles.instruction}>{step.instruction}</Text>
          {step.explanation && (
            <Text style={styles.explanation}>{step.explanation}</Text>
          )}
        </View>
      )}

      {showBreathAnimation && (
        <View style={styles.breathInstructionWrapper}>
          <Text style={styles.breathInstruction}>{step.instruction}</Text>
        </View>
      )}

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{timeRemaining}s</Text>
      </View>
    </View>
  );
}

const breathStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
  },
  outerRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#8fae93',
  },
  middleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(143, 174, 147, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(143, 174, 147, 0.35)',
  },
  innerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#8fae93',
  },
  phaseLabel: {
    position: 'absolute',
    bottom: 10,
    fontSize: 14,
    fontWeight: '300',
    color: '#8a9b8e',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  instructionCard: {
    backgroundColor: '#0d1510',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1a2b1e',
  },
  stepTitle: {
    color: '#8fae93',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  instruction: {
    color: '#f0f4f1',
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 30,
  },
  explanation: {
    color: '#8a9b8e',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  breathInstructionWrapper: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  breathInstruction: {
    color: '#8a9b8e',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  timerContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  timer: {
    color: '#8a9b8e',
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 1,
  },
});
