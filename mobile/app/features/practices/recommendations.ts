import { Practice, UserState } from './types';
import { practices } from './practiceLibrary';

const RECOMMENDATION_MAP: Record<UserState, string[]> = {
  anxiety: ['long-exhale-reset', 'five-four-three-two-one-grounding', 'room-orientation'],
  panicLite: ['five-four-three-two-one-grounding', 'feet-on-floor', 'room-orientation'],
  overthinking: ['notice-the-thought', 'room-orientation', 'let-the-day-end'],
  bodyTension: ['jaw-shoulders-release', 'mini-pmr', 'desk-body-release'],
  anger: ['cyclic-sigh', 'anger-cooling', 'jaw-shoulders-release'],
  numb: ['feet-on-floor', 'room-orientation', 'five-four-three-two-one-grounding'],
  sleep: ['sleep-exhale', 'body-heavy', 'let-the-day-end'],
  focus: ['box-breathing', 'before-meeting-reset', 'one-small-next-step'],
  burnout: ['micro-rest', 'no-force-breathing', 'low-energy-check-in'],
  workStress: ['before-meeting-reset', 'desk-body-release', 'long-exhale-reset'],
  sadness: ['sadness-grounding', 'body-heavy', 'low-energy-check-in'],
  shame: ['shame-softening', 'room-orientation', 'notice-the-thought'],
  lowEnergy: ['low-energy-check-in', 'micro-rest', 'one-small-next-step'],
  quickReset: ['long-exhale-reset', 'feet-on-floor', 'jaw-shoulders-release'],
};

export function getRecommendedPractices(state: UserState): Practice[] {
  const ids = RECOMMENDATION_MAP[state] || [];
  return ids.map(id => practices.find(p => p.id === id)).filter(Boolean) as Practice[];
}

export const STATE_OPTIONS: { label: string; value: UserState }[] = [
  { label: 'Anxious', value: 'anxiety' },
  { label: 'Overthinking', value: 'overthinking' },
  { label: 'Tense body', value: 'bodyTension' },
  { label: 'Angry', value: 'anger' },
  { label: 'Numb / frozen', value: 'numb' },
  { label: 'Need sleep', value: 'sleep' },
  { label: 'Need focus', value: 'focus' },
  { label: 'Burned out', value: 'burnout' },
  { label: 'Work stress', value: 'workStress' },
  { label: 'Quick reset', value: 'quickReset' },
];

const USER_STATE_LABELS: Record<UserState, string> = {
  anxiety: 'Anxious',
  panicLite: 'Panic-like activation',
  overthinking: 'Overthinking',
  bodyTension: 'Tense body',
  anger: 'Angry',
  numb: 'Numb / frozen',
  sleep: 'Need sleep',
  focus: 'Need focus',
  burnout: 'Burned out',
  workStress: 'Work stress',
  sadness: 'Sadness',
  shame: 'Shame',
  lowEnergy: 'Low energy',
  quickReset: 'Quick reset',
};

export function getUserStateLabel(state: UserState): string {
  return USER_STATE_LABELS[state] || state;
}

const RECOMMENDATION_REASONS: Partial<Record<UserState, Record<string, string>>> = {
  anxiety: {
    'long-exhale-reset': 'Longer exhales may help the body settle.',
    'five-four-three-two-one-grounding': 'Engages the senses to pull attention outward.',
    'room-orientation': 'Slow visual orienting can reduce inner tunnel vision.',
  },
  overthinking: {
    'notice-the-thought': 'Observes thoughts without engaging them.',
    'room-orientation': 'Brings attention from inner loops to external space.',
    'let-the-day-end': 'Helps release the day before it replays.',
  },
  bodyTension: {
    'jaw-shoulders-release': 'Targets common tension-holding areas directly.',
    'mini-pmr': 'Squeeze-and-release moves tension out of the body.',
    'desk-body-release': 'Quick body reset without standing up.',
  },
  anger: {
    'cyclic-sigh': 'Double inhale, long exhale to discharge activation.',
    'anger-cooling': 'Gives anger a physical outlet without acting on it.',
    'jaw-shoulders-release': 'Releases tension from clenching.',
  },
  numb: {
    'feet-on-floor': 'Physical contact brings attention back to the body.',
    'room-orientation': 'Visual engagement brings attention back to the room.',
    'five-four-three-two-one-grounding': 'Senses reconnect you to the present.',
  },
  sleep: {
    'sleep-exhale': 'Progressively longer exhales prepare the body for rest.',
    'body-heavy': 'Invites heaviness to ease into sleep.',
    'let-the-day-end': 'Releases what happened today so sleep can come.',
  },
  focus: {
    'box-breathing': 'Structured rhythm sharpens attention.',
    'before-meeting-reset': 'Quick presence reset before demanding tasks.',
    'one-small-next-step': 'Cuts through overwhelm with one micro-action.',
  },
  burnout: {
    'micro-rest': 'Permission to stop for 60 seconds.',
    'no-force-breathing': 'Breathing without technique or effort.',
    'low-energy-check-in': 'Gentle check-in that asks very little.',
  },
  workStress: {
    'before-meeting-reset': 'Quick reset between meetings or tasks.',
    'desk-body-release': 'Releases sitting tension without leaving the desk.',
    'long-exhale-reset': 'May help the body settle after sustained pressure.',
  },
  sadness: {
    'sadness-grounding': 'Be with sadness without drowning in it.',
    'body-heavy': 'Lets the body rest when emotion is heavy.',
    'low-energy-check-in': 'Low-demand acknowledgment of how you feel.',
  },
  shame: {
    'shame-softening': 'Creates distance from the inner critic.',
    'room-orientation': 'Shifts attention from internal judgment to external space.',
    'notice-the-thought': 'Observes shame-thoughts as passing events.',
  },
  lowEnergy: {
    'low-energy-check-in': 'Requires almost nothing. Just notice.',
    'micro-rest': 'A tiny intentional pause.',
    'one-small-next-step': 'One small action to start moving again.',
  },
  quickReset: {
    'long-exhale-reset': 'Fast breathing reset in under 2 minutes.',
    'feet-on-floor': 'Instant grounding in under a minute.',
    'jaw-shoulders-release': 'Quick tension release for common holding areas.',
  },
  panicLite: {
    'five-four-three-two-one-grounding': 'Grounds through the senses when activation feels high.',
    'feet-on-floor': 'Simple body contact to anchor attention.',
    'room-orientation': 'Slow looking around interrupts narrowed vision.',
  },
};

export function getRecommendationReason(state: UserState, practiceId: string): string {
  return RECOMMENDATION_REASONS[state]?.[practiceId] || '';
}
