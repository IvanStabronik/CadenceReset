import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Practice } from '../types';

interface PracticeCardProps {
  practice: Practice;
  onPress: () => void;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes === 1 ? '1 min' : `${minutes} min`;
}

function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function PracticeCard({ practice, onPress }: PracticeCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${practice.title}, ${formatDuration(practice.durationSec)}, ${categoryLabel(practice.category)}`}
    >
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{categoryLabel(practice.category)}</Text>
        </View>
        <Text style={styles.duration}>{formatDuration(practice.durationSec)}</Text>
      </View>
      <Text style={styles.title}>{practice.title}</Text>
      <Text style={styles.subtitle}>{practice.subtitle}</Text>
      <View style={styles.footer}>
        <View style={styles.intensityBadge}>
          <Text style={styles.intensityText}>{practice.intensity}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1510',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a2b1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(143, 174, 147, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#8fae93',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  duration: {
    color: '#8a9b8e',
    fontSize: 13,
    fontWeight: '400',
  },
  title: {
    color: '#f0f4f1',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  subtitle: {
    color: '#8a9b8e',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityBadge: {
    backgroundColor: 'rgba(143, 174, 147, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  intensityText: {
    color: '#8a9b8e',
    fontSize: 11,
    fontWeight: '400',
    textTransform: 'capitalize',
  },
});
