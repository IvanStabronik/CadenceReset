import { UserState } from '../features/practices/types';

// TODO: Replace with real analytics (Amplitude, Mixpanel, PostHog, etc.)
export const analytics = {
  practiceStarted: (practiceId: string, userState?: UserState) => {
    console.log('[analytics] practice_started', { practiceId, userState });
  },
  practiceStepCompleted: (practiceId: string, stepId: string) => {
    console.log('[analytics] practice_step_completed', { practiceId, stepId });
  },
  practiceCompleted: (practiceId: string) => {
    console.log('[analytics] practice_completed', { practiceId });
  },
  practiceAbandoned: (practiceId: string, stepIndex: number) => {
    console.log('[analytics] practice_abandoned', { practiceId, stepIndex });
  },
  feedbackSubmitted: (practiceId: string, shift: string) => {
    console.log('[analytics] practice_feedback_submitted', { practiceId, shift });
  },
  recommendationSelected: (userState: UserState, practiceId: string) => {
    console.log('[analytics] recommendation_selected', { userState, practiceId });
  },
};
