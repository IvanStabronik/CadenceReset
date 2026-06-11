export type PracticeCategory =
  | 'breath' | 'grounding' | 'body' | 'mindfulness'
  | 'sleep' | 'focus' | 'workday' | 'emotional' | 'burnout';

export type PracticeIntensity = 'low' | 'medium';

export type PracticePhase =
  | 'intro' | 'inhale' | 'hold' | 'exhale' | 'pause'
  | 'notice' | 'orient' | 'press' | 'release' | 'reflect' | 'complete';

export type UserState =
  | 'anxiety' | 'panicLite' | 'overthinking' | 'bodyTension'
  | 'anger' | 'numb' | 'sleep' | 'focus' | 'burnout'
  | 'workStress' | 'sadness' | 'shame' | 'lowEnergy' | 'quickReset';

export type BreathPattern = {
  inhaleSec: number;
  exhaleSec: number;
  holdAfterInhaleSec?: number;
  holdAfterExhaleSec?: number;
  cycles: number;
};

export type PracticeStep = {
  id: string;
  title?: string;
  instruction: string;
  explanation?: string;
  durationSec: number;
  phase?: PracticePhase;
  haptic?: boolean;
  voiceCue?: string;
  voiceDelaySec?: number;
};

export type Practice = {
  id: string;
  title: string;
  shortTitle?: string;
  subtitle: string;
  description: string;
  category: PracticeCategory;
  durationSec: number;
  intensity: PracticeIntensity;
  useCases: UserState[];
  tags: string[];
  avoidIf?: string[];
  safetyNote?: string;
  beforePrompt: string;
  afterPrompt: string;
  fallbackPracticeId?: string;
  breathPattern?: BreathPattern;
  steps: PracticeStep[];
  isPremium?: boolean;
  pack: 'mvp' | 'workday' | 'emotional' | 'sleep' | 'burnout';
};

export type CheckInScores = {
  stress: number;
  bodyTension: number;
  mentalNoise: number;
};

export type PracticeSession = {
  practiceId: string;
  startedAt: string;
  completedAt?: string;
  completed: boolean;
  userState?: UserState;
  before?: CheckInScores;
  after?: CheckInScores;
  reliefDelta?: CheckInScores;
  feedbackShift?: 'better' | 'same' | 'worse';
  feedbackSkipped?: boolean;
  wouldUseAgain?: 'yes' | 'maybe' | 'no';
};
