import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PreparationScreen from '../screens/PreparationScreen';
import ExecutionScreen from '../screens/ExecutionScreen';
import FeedbackScreen from '../screens/FeedbackScreen';

export type InterventionFlowParamList = {
  Preparation: undefined;
  Execution: undefined;
  Feedback: undefined;
};

const Stack = createNativeStackNavigator<InterventionFlowParamList>();

export default function InterventionFlowNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent gesture-based dismiss during flow
      }}
    >
      <Stack.Screen name="Preparation" component={PreparationScreen} />
      <Stack.Screen name="Execution" component={ExecutionScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
    </Stack.Navigator>
  );
}
