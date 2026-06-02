import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { useProtocolStore } from '../store/useProtocolStore';
import { useSessionStore } from '../store/useSessionStore';
import { Protocol } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const MAX_LENGTH = 500;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [triggerContext, setTriggerContext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setProtocol = useProtocolStore((state) => state.setProtocol);
  const setPhase = useSessionStore((state) => state.setPhase);
  const setTriggerCtx = useSessionStore((state) => state.setTriggerContext);

  const handleSubmit = async () => {
    if (!triggerContext.trim()) {
      setError('Please describe how you feel');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let protocol: Protocol;
      try {
        protocol = await api.post<Protocol>('/recommendation/match', {
          trigger_context: triggerContext,
        });
      } catch {
        const lowerCtx = triggerContext.trim().toLowerCase();
        protocol = lowerCtx.includes('meeting')
          ? {
              id: 'mock-1',
              name: 'Physiological Sigh',
              duration_seconds: 60,
              instruction_text: 'Double inhale through the nose, long exhale through the mouth.',
              animation_type: 'breathing_circle',
              audio_guide_url: null,
            }
          : {
              id: 'mock-2',
              name: 'Box Breathing',
              duration_seconds: 240,
              instruction_text: 'Inhale 4s, hold 4s, exhale 4s, hold 4s.',
              animation_type: 'box_square',
              audio_guide_url: null,
            };
      }

      setProtocol(protocol);
      setTriggerCtx(triggerContext.trim());
      setPhase('preparation');
      navigation.navigate('InterventionFlow');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.brand}>cadence</Text>
        <Text style={styles.title}>What's on your mind?</Text>
        <Text style={styles.subtitle}>
          Describe what you're experiencing right now
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g., back-to-back meetings, feeling overwhelmed..."
            placeholderTextColor="#5a6b5e"
            value={triggerContext}
            onChangeText={(text) => {
              setTriggerContext(text);
              if (error) setError(null);
            }}
            maxLength={MAX_LENGTH}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>
            {triggerContext.length}/{MAX_LENGTH}
          </Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#050706" />
          ) : (
            <Text style={styles.buttonText}>Begin Reset</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050706',
  },
  content: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: '#5a6b5e',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '200',
    color: '#f0f4f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8a9b8e',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#0d1510',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#1a2b1e',
    color: '#f0f4f1',
    lineHeight: 24,
  },
  counter: {
    textAlign: 'right',
    marginTop: 6,
    fontSize: 12,
    color: '#5a6b5e',
  },
  error: {
    color: '#e07070',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#8fae93',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#050706',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
