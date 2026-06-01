import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProtocolStore } from '../store/useProtocolStore';
import { useSessionStore } from '../store/useSessionStore';
import { InterventionFlowParamList } from '../navigation/InterventionFlowNavigator';

type PreparationNavigationProp = NativeStackNavigationProp<InterventionFlowParamList, 'Preparation'>;

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  if (remainingSeconds === 0) return `${minutes} min`;
  return `${minutes} min ${remainingSeconds}s`;
}

export default function PreparationScreen() {
  const navigation = useNavigation<PreparationNavigationProp>();
  const protocol = useProtocolStore((state) => state.protocol);
  const setPhase = useSessionStore((state) => state.setPhase);

  if (!protocol) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No protocol loaded</Text>
      </View>
    );
  }

  const handleBegin = () => {
    setPhase('execution');
    navigation.navigate('Execution');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{protocol.name}</Text>
      <Text style={styles.duration}>{formatDuration(protocol.duration_seconds)}</Text>
      <Text style={styles.instruction}>{protocol.instruction_text}</Text>

      <TouchableOpacity style={styles.button} onPress={handleBegin}>
        <Text style={styles.buttonText}>Begin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
    textAlign: 'center',
  },
  duration: {
    fontSize: 20,
    color: '#4a90d9',
    fontWeight: '600',
    marginBottom: 24,
  },
  instruction: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
});
