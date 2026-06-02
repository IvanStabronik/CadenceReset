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
  return `${minutes}m ${remainingSeconds}s`;
}

export default function PreparationScreen() {
  const navigation = useNavigation<PreparationNavigationProp>();
  const protocol = useProtocolStore((state) => state.protocol);
  const setPhase = useSessionStore((state) => state.setPhase);

  if (!protocol) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Protocol not loaded</Text>
      </View>
    );
  }

  const handleBegin = () => {
    setPhase('execution');
    navigation.navigate('Execution');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.label}>YOUR PROTOCOL</Text>
        <Text style={styles.title}>{protocol.name}</Text>
        <Text style={styles.duration}>{formatDuration(protocol.duration_seconds)}</Text>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.instruction}>{protocol.instruction_text}</Text>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.hint}>Find a comfortable position and take a moment to settle in</Text>
        <TouchableOpacity style={styles.button} onPress={handleBegin} activeOpacity={0.7}>
          <Text style={styles.buttonText}>I'm Ready</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050706',
    padding: 28,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingTop: 60,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 3,
    color: '#5a6b5e',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    color: '#f0f4f1',
    marginBottom: 8,
    textAlign: 'center',
  },
  duration: {
    fontSize: 18,
    color: '#8fae93',
    fontWeight: '300',
  },
  middleSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instruction: {
    fontSize: 16,
    color: '#8a9b8e',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  hint: {
    fontSize: 13,
    color: '#5a6b5e',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#8fae93',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 56,
  },
  buttonText: {
    color: '#050706',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 16,
    color: '#e07070',
    textAlign: 'center',
  },
});
