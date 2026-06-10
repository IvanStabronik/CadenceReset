import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { usePracticeStore } from '../../../store/practiceStore';
import { formatScoreChange } from '../helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PracticeResult'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'PracticeResult'>;

export default function PracticeResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { userState } = route.params || {};

  const latestSession = usePracticeStore((s) => {
    const sessions = s.sessions;
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].completed) return sessions[i];
    }
    return undefined;
  });

  const handleDone = () => {
    navigation.popToTop();
  };

  const handleTryAnother = () => {
    const sessionState = latestSession?.userState || userState;
    if (sessionState) {
      navigation.navigate('PracticeLibrary', { userState: sessionState });
    } else {
      navigation.navigate('PracticeLibrary');
    }
  };

  // No session found fallback
  if (!latestSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Session complete.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasScores = !!(latestSession.before && latestSession.after);
  const feedbackSkipped = !!latestSession.feedbackSkipped;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Session complete.</Text>

        {hasScores && latestSession.before && latestSession.after && (
          <View style={styles.scoresContainer}>
            <ScoreRow
              label="Stress"
              before={latestSession.before.stress}
              after={latestSession.after.stress}
            />
            <ScoreRow
              label="Body tension"
              before={latestSession.before.bodyTension}
              after={latestSession.after.bodyTension}
            />
            <ScoreRow
              label="Mental noise"
              before={latestSession.before.mentalNoise}
              after={latestSession.after.mentalNoise}
            />
            <Text style={styles.encouragement}>Small shift is enough.</Text>
          </View>
        )}

        {feedbackSkipped && !hasScores && (
          <Text style={styles.note}>No feedback saved.</Text>
        )}

        {!hasScores && !feedbackSkipped && (
          <Text style={styles.note}>Notice what changed.</Text>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleTryAnother}>
            <Text style={styles.secondaryButtonText}>Try another reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ScoreRow({ label, before, after }: { label: string; before: number; after: number }) {
  const change = before - after;
  const changeColor = change > 0 ? '#8fae93' : change < 0 ? '#e07070' : '#8a9b8e';

  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{formatScoreChange(before, after)}</Text>
      {change !== 0 && (
        <Text style={[styles.scoreChange, { color: changeColor }]}>
          {change > 0 ? `−${change}` : `+${Math.abs(change)}`}
        </Text>
      )}
    </View>
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
    padding: 28,
  },
  content: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    color: '#f0f4f1',
    marginBottom: 32,
  },
  scoresContainer: {
    marginBottom: 32,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2b1e',
  },
  scoreLabel: {
    flex: 1,
    fontSize: 15,
    color: '#8a9b8e',
  },
  scoreValue: {
    fontSize: 15,
    color: '#f0f4f1',
    marginRight: 12,
  },
  scoreChange: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },
  encouragement: {
    fontSize: 14,
    color: '#5a6b5e',
    marginTop: 16,
    fontStyle: 'italic',
  },
  note: {
    fontSize: 15,
    color: '#8a9b8e',
    marginBottom: 32,
  },
  buttons: {
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#8fae93',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#050706',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#0d1510',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2b1e',
  },
  secondaryButtonText: {
    color: '#8fae93',
    fontSize: 15,
    fontWeight: '500',
  },
});
