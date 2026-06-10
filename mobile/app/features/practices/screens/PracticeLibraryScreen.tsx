import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { practices } from '../practiceLibrary';
import { getRecommendedPractices } from '../recommendations';
import { Practice, PracticeCategory, UserState } from '../types';
import PracticeCard from '../components/PracticeCard';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { analytics } from '../../../services/analytics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PracticeLibrary'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'PracticeLibrary'>;

const CATEGORIES: { label: string; value: PracticeCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Breath', value: 'breath' },
  { label: 'Grounding', value: 'grounding' },
  { label: 'Body', value: 'body' },
  { label: 'Mindfulness', value: 'mindfulness' },
  { label: 'Sleep', value: 'sleep' },
  { label: 'Focus', value: 'focus' },
  { label: 'Workday', value: 'workday' },
  { label: 'Emotional', value: 'emotional' },
  { label: 'Burnout', value: 'burnout' },
];

export default function PracticeLibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const userState = route.params?.userState as UserState | undefined;

  const [selectedCategory, setSelectedCategory] = useState<PracticeCategory | 'all'>('all');

  const displayPractices: Practice[] = useMemo(() => {
    if (userState && selectedCategory === 'all') {
      return getRecommendedPractices(userState);
    }
    if (selectedCategory === 'all') {
      return practices;
    }
    return practices.filter(p => p.category === selectedCategory);
  }, [selectedCategory, userState]);

  const handlePracticePress = (practice: Practice) => {
    if (userState) {
      analytics.recommendationSelected(userState, practice.id);
    }
    navigation.navigate('PracticeDetail', { practiceId: practice.id, userState });
  };

  const headerText = userState
    ? 'Recommended for you'
    : 'Practice Library';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{headerText}</Text>
        {userState && (
          <Text style={styles.subtitle}>Based on your current state</Text>
        )}
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.chip,
                selectedCategory === cat.value && styles.chipActive,
              ]}
              onPress={() => setSelectedCategory(cat.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategory === cat.value }}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === cat.value && styles.chipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={displayPractices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PracticeCard
            practice={item}
            onPress={() => handlePracticePress(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No practices in this category yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050706',
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    color: '#f0f4f1',
  },
  subtitle: {
    fontSize: 14,
    color: '#8a9b8e',
    marginTop: 4,
  },
  filtersContainer: {
    paddingVertical: 12,
  },
  filters: {
    paddingHorizontal: 28,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0d1510',
    borderWidth: 1,
    borderColor: '#1a2b1e',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: 'rgba(143, 174, 147, 0.15)',
    borderColor: '#8fae93',
  },
  chipText: {
    color: '#8a9b8e',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#8fae93',
  },
  list: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8a9b8e',
    fontSize: 15,
  },
});
