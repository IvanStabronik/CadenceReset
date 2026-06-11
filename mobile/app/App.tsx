import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show app after max 2s, auth is non-blocking
    const timeout = setTimeout(() => setIsLoading(false), 2000);

    (async () => {
      try {
        const { restoreSession, signInAnonymously } = await import('./services/auth');
        const restored = await restoreSession();
        if (!restored) {
          await signInAnonymously();
        }
      } catch (e) {
        console.warn('Auth init failed, continuing without auth:', e);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    })();

    return () => clearTimeout(timeout);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8fae93" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050706',
  },
});
