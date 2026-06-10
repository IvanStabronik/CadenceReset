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
import { STATE_OPTIONS } from '../../practices/recommendations';
import { UserState } from '../../practices/types';
import { RootStackParamList } from '../../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'StateCheckIn'>;

export default function StateCheckInScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleSelect = (state: UserState) => {
    navigation.navigate('PracticeLibrary', { userState: state });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What do you need right now?</Text>
        <Text style={styles.subtitle}>Choose what feels closest</Text>

        <View style={styles.grid}>
          {STATE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.card}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <Text style={styles.cardLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '200',
    color: '#f0f4f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8a9b8e',
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#0d1510',
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a2b1e',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
  },
  cardLabel: {
    color: '#f0f4f1',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 21,
  },
});
