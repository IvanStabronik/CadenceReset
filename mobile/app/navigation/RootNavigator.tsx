import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import InterventionFlowNavigator from './InterventionFlowNavigator';
import StateCheckInScreen from '../features/checkin/screens/StateCheckInScreen';
import PracticeLibraryScreen from '../features/practices/screens/PracticeLibraryScreen';
import PracticeDetailScreen from '../features/practices/screens/PracticeDetailScreen';
import PracticeBeforeCheckInScreen from '../features/practices/screens/PracticeBeforeCheckInScreen';
import PracticeSessionScreen from '../features/practices/screens/PracticeSessionScreen';
import PracticeFeedbackScreen from '../features/practices/screens/PracticeFeedbackScreen';
import { UserState } from '../features/practices/types';

export type RootStackParamList = {
  Home: undefined;
  InterventionFlow: undefined;
  StateCheckIn: undefined;
  PracticeLibrary: { userState?: UserState } | undefined;
  PracticeDetail: { practiceId: string; userState?: UserState };
  PracticeBeforeCheckIn: { practiceId: string; userState?: UserState };
  PracticeSession: { practiceId: string; userState?: UserState };
  PracticeFeedback: { practiceId: string; userState?: UserState };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="InterventionFlow"
        component={InterventionFlowNavigator}
        options={{ presentation: 'modal', gestureEnabled: false }}
      />
      <Stack.Screen name="StateCheckIn" component={StateCheckInScreen} />
      <Stack.Screen name="PracticeLibrary" component={PracticeLibraryScreen} />
      <Stack.Screen name="PracticeDetail" component={PracticeDetailScreen} />
      <Stack.Screen name="PracticeBeforeCheckIn" component={PracticeBeforeCheckInScreen} />
      <Stack.Screen
        name="PracticeSession"
        component={PracticeSessionScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="PracticeFeedback" component={PracticeFeedbackScreen} />
    </Stack.Navigator>
  );
}
