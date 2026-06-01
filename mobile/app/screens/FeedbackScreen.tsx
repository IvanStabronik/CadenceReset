import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { useProtocolStore } from '../store/useProtocolStore';
import { useSessionStore } from '../store/useSessionStore';
import { FeedbackResult } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type FeedbackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FEEDBACK_OPTIONS: { label: string; value: FeedbackResult }[] = [
  { label: 'Better', value: 'better' },
  { label: 'No Change', value: 'no_change' },
  { label: 'Worse', value: 'worse' },
];

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackNavigationProp>();
  const [submitting, setSubmitting] = useState(false);

  const protocol = useProtocolStore((state) => state.protocol);
  const clearProtocol = useProtocolStore((state) => state.clearProtocol);
  const elapsedSeconds = useSessionStore((state) => state.elapsedSeconds);
  const completedFully = useSessionStore((state) => state.completedFully);
  const reset = useSessionStore((state) => state.reset);

  const handleFeedback = async (feedbackResult: FeedbackResult) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await api.post('/log', {
        protocol_id: protocol?.id,
        trigger_context: 'user_session',
        feedback_result: feedbackResult,
        completed_fully: completedFully,
        actual_duration_seconds: elapsedSeconds,
      });
    } catch (err) {
      // Log error but don't block user — still dismiss
      console.error('Failed to log intervention:', err);
    } finally {
      // Always dismiss modal and reset state
      clearProtocol();
      reset();
      navigation.getParent()?.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How do you feel?</Text>
      <Text style={styles.subtitle}>
        Rate your state after the exercise
      </Text>

      <View style={styles.buttonsContainer}>
        {FEEDBACK_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={() => handleFeedback(option.value)}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
