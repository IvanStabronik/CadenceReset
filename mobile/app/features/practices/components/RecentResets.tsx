import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PracticeSession } from '../types';
import { getPracticeById } from '../practiceLibrary';
import { formatRelativeTime, getSessionStatusLabel, formatReliefDelta } from '../helpers';

interface RecentResetsProps {
  sessions: PracticeSession[];
}

export default function RecentResets({ sessions }: RecentResetsProps) {
  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Recent resets</Text>
        <Text style={styles.emptyText}>No resets yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent resets</Text>
      {sessions.map((session, index) => {
        const practice = getPracticeById(session.practiceId);
        const title = practice?.title || 'Unknown practice';
        const status = getSessionStatusLabel(session);
        const time = session.completedAt || session.startedAt;
        const relativeTime = formatRelativeTime(time);
        const relief = formatReliefDelta(session.reliefDelta);

        return (
          <View key={`${session.practiceId}-${session.startedAt}-${index}`} style={styles.item}>
            <Text style={styles.itemTitle}>{title}</Text>
            <View style={styles.itemMeta}>
              <Text style={styles.itemStatus}>{status}</Text>
              {relief ? <Text style={styles.itemRelief}>{relief}</Text> : null}
              <Text style={styles.itemTime}>{relativeTime}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#8fae93',
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#5a6b5e',
  },
  item: {
    backgroundColor: '#0d1510',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a2b1e',
  },
  itemTitle: {
    fontSize: 15,
    color: '#f0f4f1',
    fontWeight: '400',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  itemStatus: {
    fontSize: 12,
    color: '#8a9b8e',
  },
  itemRelief: {
    fontSize: 12,
    color: '#8fae93',
  },
  itemTime: {
    fontSize: 12,
    color: '#5a6b5e',
  },
});
