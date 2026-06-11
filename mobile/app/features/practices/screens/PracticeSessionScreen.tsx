import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPracticeById } from '../practiceLibrary';
import { usePracticeStore } from '../../../store/practiceStore';
import { analytics } from '../../../services/analytics';
import PracticeStepView from '../components/PracticeStepView';
import BreathingSessionView from '../components/BreathingSessionView';
import { useVoiceGuidance } from '../hooks/useVoiceGuidance';
import { RootStackParamList } from '../../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PracticeSession'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'PracticeSession'>;

export default function PracticeSessionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { practiceId, userState } = route.params;
  const practice = getPracticeById(practiceId);

  const currentSession = usePracticeStore((s) => s.currentSession);
  const startSession = usePracticeStore((s) => s.startSession);
  const abandonSession = usePracticeStore((s) => s.abandonSession);
  const voiceGuidanceEnabled = usePracticeStore((s) => s.voiceGuidanceEnabled);
  const setVoiceGuidanceEnabled = usePracticeStore((s) => s.setVoiceGuidanceEnabled);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [useBreathMode, setUseBreathMode] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = practice?.steps ?? [];
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (currentStepIndex + 1) / totalSteps : 0;

  // Voice guidance for step mode
  const voiceText = !useBreathMode ? (currentStep?.voiceCue || currentStep?.instruction) : undefined;
  useVoiceGuidance({
    enabled: voiceGuidanceEnabled && !useBreathMode && isStarted,
    text: voiceText,
    paused: isPaused,
    delaySec: currentStep?.voiceDelaySec,
  });

  // Start session on mount — only if not already started for this practice
  useEffect(() => {
    if (practice) {
      if (!currentSession || currentSession.practiceId !== practice.id) {
        startSession(practice.id, userState);
      }
      analytics.practiceStarted(practice.id, userState);

      // Decide mode: breath pattern or step-by-step
      if (practice.breathPattern) {
        setUseBreathMode(true);
      } else {
        setTimeRemaining(steps[0]?.durationSec ?? 0);
      }
      setIsStarted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer logic — only for step mode (not breath mode)
  useEffect(() => {
    if (!isStarted || isPaused || useBreathMode) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isPaused, currentStepIndex, useBreathMode]);

  // Auto-advance when timer hits 0 — only for step mode
  useEffect(() => {
    if (timeRemaining === 0 && isStarted && !isPaused && !useBreathMode) {
      handleNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  const handleNext = useCallback(() => {
    if (!practice) return;

    if (currentStep) {
      analytics.practiceStepCompleted(practice.id, currentStep.id);
    }

    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeRemaining(steps[nextIndex].durationSec);
    } else {
      // Practice complete
      analytics.practiceCompleted(practice.id);
      navigation.replace('PracticeFeedback', { practiceId: practice.id, userState });
    }
  }, [currentStepIndex, totalSteps, steps, practice, navigation, currentStep]);

  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  const handleExit = () => {
    Alert.alert(
      'End practice?',
      'Your progress will not be saved.',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            if (practice) {
              analytics.practiceAbandoned(practice.id, currentStepIndex);
            }
            abandonSession();
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (!practice || (!useBreathMode && !currentStep)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Practice not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleExit} accessibilityRole="button" accessibilityLabel="Exit practice">
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>
          {useBreathMode ? 'Breathing' : `${currentStepIndex + 1} / ${totalSteps}`}
        </Text>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            onPress={() => setVoiceGuidanceEnabled(!voiceGuidanceEnabled)}
            accessibilityRole="button"
            accessibilityLabel={voiceGuidanceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            <Text style={[styles.voiceToggle, !voiceGuidanceEnabled && styles.voiceToggleOff]}>
              {voiceGuidanceEnabled ? '🔊' : '🔇'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePauseResume} accessibilityRole="button" accessibilityLabel={isPaused ? 'Resume' : 'Pause'}>
            <Text style={styles.pauseText}>{isPaused ? '▶' : '⏸'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar — hidden in breath mode (BreathingSessionView has its own cycle indicator) */}
      {!useBreathMode && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {/* Paused overlay */}
      {isPaused && (
        <View style={styles.pausedOverlay}>
          <Text style={styles.pausedText}>Paused</Text>
          <TouchableOpacity style={styles.resumeButton} onPress={handlePauseResume}>
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Breath mode — always mounted, receives paused prop */}
      {useBreathMode && practice.breathPattern && (
        <BreathingSessionView
          breathPattern={practice.breathPattern}
          paused={isPaused}
          voiceEnabled={voiceGuidanceEnabled}
          onComplete={() => {
            analytics.practiceCompleted(practice.id);
            navigation.replace('PracticeFeedback', { practiceId: practice.id, userState });
          }}
        />
      )}

      {/* Step mode content */}
      {!isPaused && !useBreathMode && (
        <PracticeStepView step={currentStep} timeRemaining={timeRemaining} />
      )}

      {/* Bottom controls — hidden in breath mode */}
      {!isPaused && !useBreathMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={currentStepIndex < totalSteps - 1 ? 'Next step' : 'Complete'}
          >
            <Text style={styles.nextButtonText}>
              {currentStepIndex < totalSteps - 1 ? 'Next' : 'Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050706',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#8a9b8e',
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  exitText: {
    color: '#8a9b8e',
    fontSize: 22,
  },
  stepIndicator: {
    color: '#8a9b8e',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  pauseText: {
    color: '#8a9b8e',
    fontSize: 18,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  voiceToggle: {
    fontSize: 16,
  },
  voiceToggleOff: {
    opacity: 0.5,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#1a2b1e',
    marginHorizontal: 24,
    borderRadius: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#8fae93',
    borderRadius: 2,
  },
  pausedOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedText: {
    color: '#8a9b8e',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  resumeButton: {
    backgroundColor: 'rgba(143, 174, 147, 0.15)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8fae93',
  },
  resumeButtonText: {
    color: '#8fae93',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: 28,
    paddingBottom: 32,
    paddingTop: 16,
  },
  nextButton: {
    backgroundColor: 'rgba(143, 174, 147, 0.15)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2b1e',
  },
  nextButtonText: {
    color: '#8fae93',
    fontSize: 16,
    fontWeight: '500',
  },
});
