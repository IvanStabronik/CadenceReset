import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { usePracticeStore } from '../../../store/practiceStore';

type BeforeCheckInRouteProp = RouteProp<RootStackParamList, 'PracticeBeforeCheckIn'>;
type BeforeCheckInNavProp = NativeStackNavigationProp<RootStackParamList, 'PracticeBeforeCheckIn'>;

function ScoreSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.scoreSection}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreRow}>
        {Array.from({ length: 11 }, (_, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.scoreButton, value === i && styles.scoreButtonActive]}
            onPress={() => onChange(i)}
          >
            <Text style={[styles.scoreButtonText, value === i && styles.scoreButtonTextActive]}>
              {i}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function PracticeBeforeCheckInScreen() {
  const navigation = useNavigation<BeforeCheckInNavProp>();
  const route = useRoute<BeforeCheckInRouteProp>();
  const { practiceId, userState } = route.params;

  const [stress, setStress] = useState(5);
  const [bodyTension, setBodyTension] = useState(5);
  const [mentalNoise, setMentalNoise] = useState(5);

  const { startSession, setBeforeScores } = usePracticeStore();

  const handleStart = () => {
    startSession(practiceId, userState);
    setBeforeScores({ stress, bodyTension, mentalNoise });
    navigation.navigate('PracticeSession', { practiceId, userState });
  };

  const handleSkip = () => {
    startSession(practiceId, userState);
    navigation.navigate('PracticeSession', { practiceId, userState });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Before you begin</Text>
      <Text style={styles.subtitle}>Rate how you feel right now. This is optional.</Text>

      <ScoreSelector label="Stress level" value={stress} onChange={setStress} />
      <ScoreSelector label="Body tension" value={bodyTension} onChange={setBodyTension} />
      <ScoreSelector label="Mental noise" value={mentalNoise} onChange={setMentalNoise} />

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.7}>
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.6}>
          <Text style={styles.skipButtonText}>Skip check-in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050706' },
  content: { padding: 28, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '200', color: '#f0f4f1', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8a9b8e', marginBottom: 32 },
  scoreSection: { marginBottom: 28 },
  scoreLabel: { fontSize: 14, color: '#8a9b8e', marginBottom: 10, letterSpacing: 0.5 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreButton: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#0d1510', borderWidth: 1, borderColor: '#1a2b1e',
    alignItems: 'center', justifyContent: 'center',
  },
  scoreButtonActive: { backgroundColor: '#8fae93', borderColor: '#8fae93' },
  scoreButtonText: { fontSize: 11, color: '#5a6b5e' },
  scoreButtonTextActive: { color: '#050706', fontWeight: '600' },
  buttons: { marginTop: 24 },
  startButton: { backgroundColor: '#8fae93', borderRadius: 14, padding: 18, alignItems: 'center' },
  startButtonText: { color: '#050706', fontSize: 17, fontWeight: '600' },
  skipButton: { marginTop: 14, padding: 14, alignItems: 'center' },
  skipButtonText: { color: '#5a6b5e', fontSize: 14 },
});
