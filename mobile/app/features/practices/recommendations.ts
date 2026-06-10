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
  { label: 'Calm anxiety', value: 'anxiety' },
  { label: 'Stop overthinking', value: 'overthinking' },
  { label: 'Release body tension', value: 'bodyTension' },
  { label: 'Cool down anger', value: 'anger' },
  { label: 'Come back to my body', value: 'numb' },
  { label: 'Fall asleep', value: 'sleep' },
  { label: 'Regain focus', value: 'focus' },
  { label: 'Recover from burnout', value: 'burnout' },
  { label: 'Reset after work stress', value: 'workStress' },
  { label: 'Quick reset', value: 'quickReset' },
];
