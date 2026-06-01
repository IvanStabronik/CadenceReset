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
        // Try to restore existing session from secure storage
        const restored = await restoreSession();
        if (!restored) {
          // No existing session — sign in anonymously
          await signInAnonymously();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Try anonymous sign-in as fallback
        try {
          await signInAnonymously();
        } catch (fallbackError) {
          console.error('Fallback auth failed:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
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
