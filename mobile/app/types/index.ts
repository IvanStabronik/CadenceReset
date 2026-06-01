// types/index.ts
export interface Protocol {
  id: string;
  name: string;
  duration_seconds: number;
  instruction_text: string;
  animation_type: string;
  audio_guide_url: string | null;
}

export type SessionPhase = 'idle' | 'preparation' | 'execution' | 'feedback';
export type FeedbackResult = 'better' | 'no_change' | 'worse';

export interface AuthState {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  login: (token: string, userId: string) => void;
  logout: () => void;
  restoreToken: () => Promise<void>;
}

export interface ProtocolState {
  protocol: Protocol | null;
  setProtocol: (protocol: Protocol) => void;
  clearProtocol: () => void;
}

export interface SessionState {
  phase: SessionPhase;
  elapsedSeconds: number;
  completedFully: boolean;
  setPhase: (phase: SessionPhase) => void;
  tick: () => void;
  complete: () => void;
  skip: () => void;
  reset: () => void;
}
