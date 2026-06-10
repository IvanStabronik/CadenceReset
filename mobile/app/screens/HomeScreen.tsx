import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STATE_OPTIONS } from '../features/practices/recommendations';
import { UserState } from '../features/practices/types';
import { RootStackParamList } from '../navigation/RootNavigator';
import { usePracticeStore } from '../store/practiceStore';
import RecentResets from '../features/practices/components/RecentResets';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const sessions = usePracticeStore((s) => s.sessions);
  const recentSessions = [...sessions].reverse().slice(0, 5);

  const handleStateSelect = (state: UserState) => {
    navigation.navigate('PracticeLibrary', { userState: state });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>cadence reset</Text>

        <Text style={styles.title}>How are you right now?</Text>

        <View style={styles.grid}>
          {STATE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.stateButton}
              onPress={() => handleStateSelect(option.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <Text style={styles.stateButtonText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hint}>
          2–5 minute guided resets. No account needed.
        </Text>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('PracticeLibrary')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Browse all practices</Text>
          </TouchableOpacity>
        </View>

        <RecentResets sessions={recentSessions} />
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
    paddingTop: 24,
    paddingBottom: 60,
  },
  brand: {
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: '#5a6b5e',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    color: '#f0f4f1',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  stateButton: {
    backgroundColor: '#0d1510',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1a2b1e',
  },
  stateButtonText: {
    color: '#f0f4f1',
    fontSize: 15,
    fontWeight: '400',
  },
  hint: {
    fontSize: 13,
    color: '#5a6b5e',
    marginBottom: 24,
  },
  secondaryRow: {
    marginBottom: 32,
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
    fontSize: 14,
    fontWeight: '500',
  },
});
