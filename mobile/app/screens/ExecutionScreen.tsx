import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSessionStore } from '../store/useSessionStore';

export default function ExecutionScreen() {
  const navigation = useNavigation();
  const phase = useSessionStore((state) => state.phase);

  useEffect(() => {
    // Prevent back navigation during execution phase
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (phase === 'execution') {
        // Block the navigation action
        e.preventDefault();
      }
    });

    return unsubscribe;
  }, [navigation, phase]);

  return (
    <View>
      <Text>Execution Screen (placeholder - will be fully implemented in Task 16.3)</Text>
    </View>
  );
}
