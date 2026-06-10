import { practices, getPracticeById } from './practiceLibrary';
import { getRecommendedPractices, STATE_OPTIONS, getRecommendationReason, getUserStateLabel } from './recommendations';
import { usePracticeStore } from '../../store/practiceStore';
import { CheckInScores, UserState, BreathPattern } from './types';
import {
  formatRelativeTime,
  formatReliefDelta,
  getSessionStatusLabel,
  formatScoreChange,
  getSessionSummary,
  getResultCopy,
  getRecentSessionLabel,
} from './helpers';

// ─── Before-scores are preserved ───────────────────────────────────────────────

describe('practiceStore — before scores preserved', () => {
  beforeEach(() => {
    usePracticeStore.setState({ sessions: [], currentSession: null, favoritePracticeIds: [] });
  });

  it('stores before scores on the current session', () => {
    const store = usePracticeStore.getState();
    store.startSession('long-exhale-reset', 'anxiety');

    const before: CheckInScores = { stress: 7, bodyTension: 6, mentalNoise: 8 };
    store.setBeforeScores(before);

    const session = usePracticeStore.getState().currentSession;
    expect(session).not.toBeNull();
    expect(session!.before).toEqual(before);
  });

  it('preserves before scores through to the completed session', () => {
    const store = usePracticeStore.getState();
    store.startSession('box-breathing', 'focus');

    const before: CheckInScores = { stress: 5, bodyTension: 4, mentalNoise: 6 };
    store.setBeforeScores(before);

    const after: CheckInScores = { stress: 3, bodyTension: 2, mentalNoise: 4 };
    usePracticeStore.getState().completeSession(after, 'better', 'yes');

    const sessions = usePracticeStore.getState().sessions;
    const completed = sessions[sessions.length - 1];
    expect(completed.before).toEqual(before);
  });
});

// ─── reliefDelta is calculated ─────────────────────────────────────────────────

describe('practiceStore — reliefDelta calculation', () => {
  beforeEach(() => {
    usePracticeStore.setState({ sessions: [], currentSession: null, favoritePracticeIds: [] });
  });

  it('calculates reliefDelta as before minus after', () => {
    const store = usePracticeStore.getState();
    store.startSession('cyclic-sigh', 'anger');

    const before: CheckInScores = { stress: 8, bodyTension: 7, mentalNoise: 9 };
    store.setBeforeScores(before);

    const after: CheckInScores = { stress: 4, bodyTension: 3, mentalNoise: 5 };
    usePracticeStore.getState().completeSession(after, 'better', 'yes');

    const sessions = usePracticeStore.getState().sessions;
    const completed = sessions[sessions.length - 1];
    expect(completed.reliefDelta).toEqual({
      stress: 4,
      bodyTension: 4,
      mentalNoise: 4,
    });
  });

  it('returns undefined reliefDelta when no before scores exist', () => {
    const store = usePracticeStore.getState();
    store.startSession('feet-on-floor', 'numb');

    const after: CheckInScores = { stress: 3, bodyTension: 2, mentalNoise: 3 };
    usePracticeStore.getState().completeSession(after, 'same', 'maybe');

    const sessions = usePracticeStore.getState().sessions;
    const completed = sessions[sessions.length - 1];
    expect(completed.reliefDelta).toBeUndefined();
  });
});

// ─── Skip feedback marks feedbackSkipped ────────────────────────────────────────

describe('practiceStore — feedbackSkipped', () => {
  beforeEach(() => {
    usePracticeStore.setState({ sessions: [], currentSession: null, favoritePracticeIds: [] });
  });

  it('marks feedbackSkipped when completing without feedback', () => {
    const store = usePracticeStore.getState();
    store.startSession('micro-rest', 'burnout');
    usePracticeStore.getState().completeWithoutFeedback();

    const sessions = usePracticeStore.getState().sessions;
    const completed = sessions[sessions.length - 1];
    expect(completed.feedbackSkipped).toBe(true);
    expect(completed.completed).toBe(true);
  });

  it('does not set feedbackSkipped when feedback is provided', () => {
    const store = usePracticeStore.getState();
    store.startSession('micro-rest', 'burnout');

    const after: CheckInScores = { stress: 2, bodyTension: 1, mentalNoise: 2 };
    usePracticeStore.getState().completeSession(after, 'better', 'yes');

    const sessions = usePracticeStore.getState().sessions;
    const completed = sessions[sessions.length - 1];
    expect(completed.feedbackSkipped).toBeUndefined();
  });
});

// ─── All recommended IDs exist in practice library ─────────────────────────────

describe('recommendations — all recommended IDs exist', () => {
  const allPracticeIds = practices.map(p => p.id);
  const allStates: UserState[] = [
    'anxiety', 'panicLite', 'overthinking', 'bodyTension',
    'anger', 'numb', 'sleep', 'focus', 'burnout',
    'workStress', 'sadness', 'shame', 'lowEnergy', 'quickReset',
  ];

  it.each(allStates)('all recommended practices for "%s" exist in the library', (state) => {
    const recommended = getRecommendedPractices(state);
    expect(recommended.length).toBeGreaterThan(0);
    for (const practice of recommended) {
      expect(allPracticeIds).toContain(practice.id);
    }
  });

  it('STATE_OPTIONS covers expected user states', () => {
    const optionValues = STATE_OPTIONS.map(o => o.value);
    expect(optionValues).toContain('anxiety');
    expect(optionValues).toContain('burnout');
    expect(optionValues).toContain('quickReset');
  });
});

// ─── Recommendation reasons ─────────────────────────────────────────────────────

describe('recommendations — reasons', () => {
  const allStates: UserState[] = [
    'anxiety', 'panicLite', 'overthinking', 'bodyTension',
    'anger', 'numb', 'sleep', 'focus', 'burnout',
    'workStress', 'sadness', 'shame', 'lowEnergy', 'quickReset',
  ];

  it.each(allStates)('recommended practices for "%s" have non-empty reasons', (state) => {
    const recommended = getRecommendedPractices(state);
    for (const practice of recommended) {
      const reason = getRecommendationReason(state, practice.id);
      expect(reason).not.toBe('');
      expect(reason.length).toBeGreaterThan(5);
    }
  });

  it.each(allStates)('getUserStateLabel returns non-empty string for "%s"', (state) => {
    const label = getUserStateLabel(state);
    expect(label).not.toBe('');
    expect(label.length).toBeGreaterThan(2);
  });
});

// ─── All fallbackPracticeIds exist in practice library ──────────────────────────

describe('practiceLibrary — all fallbackPracticeIds exist', () => {
  const allPracticeIds = practices.map(p => p.id);
  const practicesWithFallback = practices.filter(p => p.fallbackPracticeId);

  it.each(practicesWithFallback.map(p => [p.id, p.fallbackPracticeId!]))(
    'practice "%s" has valid fallbackPracticeId "%s"',
    (_id, fallbackId) => {
      expect(allPracticeIds).toContain(fallbackId);
    },
  );

  it('no practice references itself as a fallback', () => {
    for (const p of practicesWithFallback) {
      expect(p.fallbackPracticeId).not.toBe(p.id);
    }
  });
});

// ─── breathPattern values are valid ─────────────────────────────────────────────

describe('practiceLibrary — breathPattern values are valid', () => {
  const practicesWithBreath = practices.filter(p => p.breathPattern);

  it('at least some practices have breathPatterns', () => {
    expect(practicesWithBreath.length).toBeGreaterThan(0);
  });

  it.each(practicesWithBreath.map(p => [p.id, p.breathPattern!]))(
    'practice "%s" has valid breathPattern values',
    (_id, pattern: BreathPattern) => {
      expect(pattern.inhaleSec).toBeGreaterThan(0);
      expect(pattern.exhaleSec).toBeGreaterThan(0);
      expect(pattern.cycles).toBeGreaterThanOrEqual(1);

      if (pattern.holdAfterInhaleSec !== undefined) {
        expect(pattern.holdAfterInhaleSec).toBeGreaterThanOrEqual(0);
      }
      if (pattern.holdAfterExhaleSec !== undefined) {
        expect(pattern.holdAfterExhaleSec).toBeGreaterThanOrEqual(0);
      }
    },
  );
});

// ─── Helper functions ───────────────────────────────────────────────────────────

describe('helpers — formatReliefDelta', () => {
  it('returns empty string for undefined', () => {
    expect(formatReliefDelta(undefined)).toBe('');
  });

  it('formats positive relief (improvement)', () => {
    const result = formatReliefDelta({ stress: 3, bodyTension: 2, mentalNoise: 4 });
    expect(result).toContain('Stress -3');
    expect(result).toContain('Body -2');
    expect(result).toContain('Noise -4');
  });

  it('formats negative relief (worsening)', () => {
    const result = formatReliefDelta({ stress: -1, bodyTension: 0, mentalNoise: -2 });
    expect(result).toContain('Stress +1');
    expect(result).toContain('Noise +2');
    expect(result).not.toContain('Body');
  });
});

describe('helpers — getSessionStatusLabel', () => {
  it('returns Abandoned for incomplete sessions', () => {
    expect(getSessionStatusLabel({ practiceId: 'x', startedAt: '', completed: false })).toBe('Abandoned');
  });

  it('returns Feedback skipped when appropriate', () => {
    expect(getSessionStatusLabel({ practiceId: 'x', startedAt: '', completed: true, feedbackSkipped: true })).toBe('Feedback skipped');
  });

  it('returns Completed for normal completion', () => {
    expect(getSessionStatusLabel({ practiceId: 'x', startedAt: '', completed: true })).toBe('Completed');
  });
});

describe('helpers — formatScoreChange', () => {
  it('formats before → after', () => {
    expect(formatScoreChange(7, 4)).toBe('7 → 4');
  });
});

describe('helpers — getResultCopy', () => {
  it('returns session ended for abandoned', () => {
    expect(getResultCopy({ practiceId: 'x', startedAt: '', completed: false })).toBe('Session ended.');
  });

  it('returns session complete for completed', () => {
    expect(getResultCopy({ practiceId: 'x', startedAt: '', completed: true })).toBe('Session complete.');
  });
});

describe('helpers — formatRelativeTime', () => {
  it('returns Just now for very recent time', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');
  });

  it('returns min ago for recent minutes', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 min ago');
  });
});
