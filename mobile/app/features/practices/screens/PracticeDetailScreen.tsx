import React from 'react';
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
import { getPracticeById } from '../practiceLibrary';
import { RootStackParamList } from '../../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PracticeDetail'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'PracticeDetail'>;

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes === 1 ? '1 min' : `${minutes} min`;
}

export default function PracticeDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { practiceId } = route.params;
  const practice = getPracticeById(practiceId);

  if (!practice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Practice not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleStart = () => {
    navigation.navigate('PracticeBeforeCheckIn', { practiceId: practice.id, userState: route.params.userState });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{practice.category}</Text>
          </View>
          <Text style={styles.duration}>{formatDuration(practice.durationSec)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{practice.intensity}</Text>
          </View>
        </View>

        <Text style={styles.title}>{practice.title}</Text>
        <Text style={styles.subtitle}>{practice.subtitle}</Text>

        <Text style={styles.description}>{practice.description}</Text>

        {practice.useCases.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Good for</Text>
            <View style={styles.tagRow}>
              {practice.useCases.map((useCase) => (
                <View key={useCase} style={styles.tag}>
                  <Text style={styles.tagText}>{useCase}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {practice.safetyNote && (
          <View style={styles.safetyBox}>
            <Text style={styles.safetyTitle}>Safety note</Text>
            <Text style={styles.safetyText}>{practice.safetyNote}</Text>
          </View>
        )}

        {practice.fallbackPracticeId && (
          <View style={styles.section}>
            <Text style={styles.fallbackText}>
              If this doesn't feel right, try a different practice.
            </Text>
          </View>
        )}

        <View style={styles.stepsPreview}>
          <Text style={styles.sectionTitle}>{practice.steps.length} steps</Text>
          {practice.steps.map((step, index) => (
            <View key={step.id} style={styles.stepItem}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepLabel}>{step.title || step.instruction.slice(0, 40)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStart}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Start practice"
        >
          <Text style={styles.startButtonText}>Start Practice</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          This is a self-guided wellness practice, not therapy or medical advice.
        </Text>
      </View>
    </SafeAreaView>
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
  },
  errorText: {
    color: '#8a9b8e',
    fontSize: 16,
  },
  content: {
    padding: 28,
    paddingBottom: 160,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#8fae93',
    fontSize: 15,
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(143, 174, 147, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#8fae93',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  duration: {
    color: '#8a9b8e',
    fontSize: 13,
  },
  title: {
    fontSize: 30,
    fontWeight: '200',
    color: '#f0f4f1',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#8a9b8e',
    marginBottom: 20,
    lineHeight: 23,
  },
  description: {
    fontSize: 15,
    color: '#f0f4f1',
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.85,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#8fae93',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#0d1510',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#1a2b1e',
  },
  tagText: {
    color: '#8a9b8e',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  safetyBox: {
    backgroundColor: 'rgba(224, 112, 112, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(224, 112, 112, 0.2)',
  },
  safetyTitle: {
    color: '#e07070',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  safetyText: {
    color: '#f0f4f1',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  fallbackText: {
    color: '#8a9b8e',
    fontSize: 13,
    fontStyle: 'italic',
  },
  stepsPreview: {
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2b1e',
  },
  stepNumber: {
    color: '#8fae93',
    fontSize: 13,
    fontWeight: '600',
    width: 24,
  },
  stepLabel: {
    color: '#f0f4f1',
    fontSize: 14,
    flex: 1,
    opacity: 0.8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 28,
    paddingBottom: 36,
    backgroundColor: '#050706',
    borderTopWidth: 1,
    borderTopColor: '#1a2b1e',
  },
  startButton: {
    backgroundColor: '#8fae93',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 10,
  },
  startButtonText: {
    color: '#050706',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  disclaimer: {
    color: '#5a6b5e',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
