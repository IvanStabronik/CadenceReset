import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import { useAuthStore } from './store/useAuthStore';
import { restoreSession, signInAnonymously } from './services/auth';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    async function initAuth() {
      try {
        const restored = await restoreSession();
        if (!restored) {
          await signInAnonymously();
        }
      } catch (error) {
        console.warn('Auth initialization failed:', error);
        // Continue anyway — user can still see the UI
      } finally {
        setIsLoading(false);
      }
    }

    // Timeout: if auth takes more than 5s, show app anyway
    const timeout = setTimeout(() => setIsLoading(false), 5000);
    initAuth().finally(() => clearTimeout(timeout));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90d9" />
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
    backgroundColor: '#f8f9fa',
  },
});
