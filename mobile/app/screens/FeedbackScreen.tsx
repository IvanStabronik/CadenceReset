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

const FEEDBACK_OPTIONS: { label: string; value: FeedbackResult; emoji: string }[] = [
  { label: 'Better', value: 'better', emoji: '✨' },
  { label: 'Same', value: 'no_change', emoji: '—' },
  { label: 'Worse', value: 'worse', emoji: '↓' },
];

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackNavigationProp>();
  const [submitting, setSubmitting] = useState(false);

  const protocol = useProtocolStore((state) => state.protocol);
  const clearProtocol = useProtocolStore((state) => state.clearProtocol);
  const elapsedSeconds = useSessionStore((state) => state.elapsedSeconds);
  const completedFully = useSessionStore((state) => state.completedFully);
  const triggerContext = useSessionStore((state) => state.triggerContext);
  const reset = useSessionStore((state) => state.reset);

  const handleFeedback = async (feedbackResult: FeedbackResult) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (protocol && triggerContext) {
        await api.post('/log', {
          protocol_id: protocol.id,
          trigger_context: triggerContext,
          feedback_result: feedbackResult,
          completed_fully: completedFully,
          actual_duration_seconds: elapsedSeconds,
        });
      }
    } catch (err) {
      console.warn('Failed to log intervention:', err);
    } finally {
      clearProtocol();
      reset();
      navigation.getParent()?.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.checkmark}>✓</Text>
        <Text style={styles.title}>Well done</Text>
        <Text style={styles.subtitle}>How do you feel now?</Text>
      </View>

      <View style={styles.buttonsContainer}>
        {FEEDBACK_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={() => handleFeedback(option.value)}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonEmoji}>{option.emoji}</Text>
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
    backgroundColor: '#050706',
    padding: 28,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 56,
  },
  checkmark: {
    fontSize: 48,
    color: '#8fae93',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    color: '#f0f4f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8a9b8e',
  },
  buttonsContainer: {
    gap: 14,
  },
  button: {
    backgroundColor: '#0d1510',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2b1e',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonEmoji: {
    fontSize: 20,
    marginRight: 16,
    width: 28,
    textAlign: 'center',
  },
  buttonText: {
    color: '#f0f4f1',
    fontSize: 17,
    fontWeight: '400',
  },
});
