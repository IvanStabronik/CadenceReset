import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import InterventionFlowNavigator from './InterventionFlowNavigator';

export type RootStackParamList = {
  Home: undefined;
  InterventionFlow: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="InterventionFlow"
        component={InterventionFlowNavigator}
        options={{
          presentation: 'modal',
          gestureEnabled: false, // Prevent gesture-based dismiss
        }}
      />
    </Stack.Navigator>
  );
}
