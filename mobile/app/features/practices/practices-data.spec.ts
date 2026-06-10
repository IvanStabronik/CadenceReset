import { practices, getPracticeById } from './practiceLibrary';
import { getRecommendedPractices, STATE_OPTIONS } from './recommendations';
import { usePracticeStore } from '../../store/practiceStore';
import { CheckInScores, UserState, BreathPattern } from './types';

// ─── Before-scores are preserved ───────────────────────────────────────────────

describe('practiceStore — before scores preserved', () => {
  beforeEach(() => {
    usePracticeStore.getState().resetCurrentSession();
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
    usePracticeStore.getState().resetCurrentSession();
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
      stress: 4,    // 8 - 4
      bodyTension: 4, // 7 - 3
      mentalNoise: 4, // 9 - 5
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

  it('handles negative reliefDelta (feeling worse)', () => {
    const store = usePracticeStore.getState();
    store.startSession('notice-the-thought', 'overthinking');

    const before: CheckInScores = { stress: 3, bodyTension: 2, mentalNoise: 4 };
    store.setBeforeScores(before);

    const after: CheckInScores = { stress: 5, bodyTension: 4, mentalNoise: 6 };
    usePracticeStore.getState().completeSession(after, 'worse', 'no');

    const sessions = usePracticeStore.getState().sessions;
    const completed = sessions[sessions.length - 1];
    expect(completed.reliefDelta).toEqual({
      stress: -2,
      bodyTension: -2,
      mentalNoise: -2,
    });
  });
});

// ─── Skip feedback marks feedbackSkipped ────────────────────────────────────────

describe('practiceStore — feedbackSkipped', () => {
  beforeEach(() => {
    usePracticeStore.getState().resetCurrentSession();
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
    // At minimum, the most common states should be available
    expect(optionValues).toContain('anxiety');
    expect(optionValues).toContain('burnout');
    expect(optionValues).toContain('quickReset');
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

  it('breathPattern durations are reasonable (not excessively long)', () => {
    for (const p of practicesWithBreath) {
      const bp = p.breathPattern!;
      expect(bp.inhaleSec).toBeLessThanOrEqual(30);
      expect(bp.exhaleSec).toBeLessThanOrEqual(30);
      expect(bp.cycles).toBeLessThanOrEqual(100);
    }
  });
});
