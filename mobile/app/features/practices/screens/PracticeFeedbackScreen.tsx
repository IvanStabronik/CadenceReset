import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePracticeStore } from '../../../store/practiceStore';
import { analytics } from '../../../services/analytics';
import { CheckInScores } from '../types';
import { RootStackParamList } from '../../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PracticeFeedback'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'PracticeFeedback'>;

type ShiftValue = 'better' | 'same' | 'worse';
type UseAgainValue = 'yes' | 'maybe' | 'no';

function ScoreSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <View style={styles.scoreSection}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreRow}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.scoreDot, value === n && styles.scoreDotActive]}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${n}`}
            accessibilityState={{ selected: value === n }}
          >
            <Text style={[styles.scoreDotText, value === n && styles.scoreDotTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function OptionButtons<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { label: string; value: T }[];
  selected: T | null;
  onSelect: (val: T) => void;
}) {
  return (
    <View style={styles.optionSection}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionButton, selected === opt.value && styles.optionButtonActive]}
            onPress={() => onSelect(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: selected === opt.value }}
          >
            <Text style={[styles.optionText, selected === opt.value && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function PracticeFeedbackScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { practiceId } = route.params;

  const completeSession = usePracticeStore((s) => s.completeSession);

  const [stress, setStress] = useState(5);
  const [bodyTension, setBodyTension] = useState(5);
  const [mentalNoise, setMentalNoise] = useState(5);
  const [shift, setShift] = useState<ShiftValue | null>(null);
  const [useAgain, setUseAgain] = useState<UseAgainValue | null>(null);

  const canSubmit = shift !== null && useAgain !== null;

  const handleSubmit = () => {
    if (!shift || !useAgain) return;

    const afterScores: CheckInScores = { stress, bodyTension, mentalNoise };
    completeSession(afterScores, shift, useAgain);
    analytics.feedbackSubmitted(practiceId, shift);
    navigation.popToTop();
  };

  const handleSkip = () => {
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How do you feel now?</Text>
        <Text style={styles.subtitle}>Quick check-in after your practice</Text>

        <ScoreSelector label="Stress" value={stress} onChange={setStress} />
        <ScoreSelector label="Body tension" value={bodyTension} onChange={setBodyTension} />
        <ScoreSelector label="Mental noise" value={mentalNoise} onChange={setMentalNoise} />

        <OptionButtons<ShiftValue>
          label="Do you feel any different?"
          options={[
            { label: 'Better', value: 'better' },
            { label: 'Same', value: 'same' },
            { label: 'Worse', value: 'worse' },
          ]}
          selected={shift}
          onSelect={setShift}
        />

        <OptionButtons<UseAgainValue>
          label="Would you use this practice again?"
          options={[
            { label: 'Yes', value: 'yes' },
            { label: 'Maybe', value: 'maybe' },
            { label: 'No', value: 'no' },
          ]}
          selected={useAgain}
          onSelect={setUseAgain}
        />

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Submit feedback"
        >
          <Text style={styles.submitButtonText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Skip feedback"
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050706',
  },
  content: {
    padding: 28,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    color: '#f0f4f1',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#8a9b8e',
    marginBottom: 32,
  },
  scoreSection: {
    marginBottom: 24,
  },
  scoreLabel: {
    color: '#f0f4f1',
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0d1510',
    borderWidth: 1,
    borderColor: '#1a2b1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDotActive: {
    backgroundColor: 'rgba(143, 174, 147, 0.2)',
    borderColor: '#8fae93',
  },
  scoreDotText: {
    color: '#8a9b8e',
    fontSize: 11,
    fontWeight: '500',
  },
  scoreDotTextActive: {
    color: '#8fae93',
  },
  optionSection: {
    marginBottom: 24,
  },
  optionLabel: {
    color: '#f0f4f1',
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0d1510',
    borderWidth: 1,
    borderColor: '#1a2b1e',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: 'rgba(143, 174, 147, 0.15)',
    borderColor: '#8fae93',
  },
  optionText: {
    color: '#8a9b8e',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#8fae93',
  },
  submitButton: {
    backgroundColor: '#8fae93',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#050706',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  skipButtonText: {
    color: '#8a9b8e',
    fontSize: 14,
  },
});
