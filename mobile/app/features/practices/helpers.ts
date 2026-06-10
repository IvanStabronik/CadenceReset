import { PracticeSession, CheckInScores } from './types';

export function getSessionStatusLabel(session: PracticeSession): string {
  if (!session.completed) return 'Abandoned';
  if (session.feedbackSkipped) return 'Feedback skipped';
  return 'Completed';
}

export function formatReliefDelta(delta?: CheckInScores): string {
  if (!delta) return '';
  const parts: string[] = [];
  if (delta.stress !== 0) parts.push(`Stress ${delta.stress > 0 ? '-' : '+'}${Math.abs(delta.stress)}`);
  if (delta.bodyTension !== 0) parts.push(`Body ${delta.bodyTension > 0 ? '-' : '+'}${Math.abs(delta.bodyTension)}`);
  if (delta.mentalNoise !== 0) parts.push(`Noise ${delta.mentalNoise > 0 ? '-' : '+'}${Math.abs(delta.mentalNoise)}`);
  return parts.join(' · ');
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function formatScoreChange(before: number, after: number): string {
  return `${before} → ${after}`;
}

export function getSessionSummary(session: PracticeSession): {
  hasScores: boolean;
  feedbackSkipped: boolean;
  abandoned: boolean;
} {
  return {
    hasScores: !!(session.before && session.after),
    feedbackSkipped: !!session.feedbackSkipped,
    abandoned: !session.completed,
  };
}

export function getResultCopy(session: PracticeSession): string {
  if (!session.completed) return 'Session ended.';
  if (session.feedbackSkipped) return 'Session complete.';
  if (session.before && session.after) return 'Session complete.';
  return 'Session complete.';
}

export function getRecentSessionLabel(session: PracticeSession): string {
  const status = getSessionStatusLabel(session);
  const relief = formatReliefDelta(session.reliefDelta);
  const time = formatRelativeTime(session.completedAt || session.startedAt);
  return [status, relief, time].filter(Boolean).join(' · ');
}
