import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
      setError('Please describe your current situation');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const protocol = await api.post<Protocol>('/recommendation/match', {
        trigger_context: triggerContext,
      });

      setProtocol(protocol);
      setTriggerCtx(triggerContext.trim());
      setPhase('preparation');
      navigation.navigate('InterventionFlow');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.subtitle}>
        Describe what's causing you stress right now
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="e.g., 3 hours of back-to-back meetings..."
          placeholderTextColor="#999"
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
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get Recommendation</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
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
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  counter: {
    textAlign: 'right',
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  error: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4a90d9',
    borderRadius: 12,
    padding: 16,
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
