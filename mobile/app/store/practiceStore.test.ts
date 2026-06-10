import { usePracticeStore } from './practiceStore';
import { CheckInScores } from '../features/practices/types';

describe('practiceStore - session lifecycle', () => {
  beforeEach(() => {
    usePracticeStore.setState({ sessions: [], currentSession: null, favoritePracticeIds: [] });
  });

  it('before scores are preserved after starting session', () => {
    const { startSession, setBeforeScores } = usePracticeStore.getState();

    startSession('long-exhale-reset', 'anxiety');
    setBeforeScores({ stress: 7, bodyTension: 6, mentalNoise: 8 });

    const session = usePracticeStore.getState().currentSession;
    expect(session).not.toBeNull();
    expect(session!.before).toEqual({ stress: 7, bodyTension: 6, mentalNoise: 8 });
    expect(session!.practiceId).toBe('long-exhale-reset');
    expect(session!.userState).toBe('anxiety');
  });

  it('before scores survive if startSession is NOT called again for same practiceId', () => {
    const { startSession, setBeforeScores } = usePracticeStore.getState();

    startSession('box-breathing', 'focus');
    setBeforeScores({ stress: 5, bodyTension: 4, mentalNoise: 6 });

    // Calling startSession again for the SAME practiceId would wipe before scores
    startSession('box-breathing', 'focus');
    const overwritten = usePracticeStore.getState().currentSession;
    expect(overwritten!.before).toBeUndefined(); // proves the guard is necessary

    // Correct path: start, set scores, and DON'T call startSession again
    usePracticeStore.setState({ sessions: [], currentSession: null });
    startSession('box-breathing', 'focus');
    usePracticeStore.getState().setBeforeScores({ stress: 5, bodyTension: 4, mentalNoise: 6 });

    // Guard check: session exists for this practiceId → do not restart
    const guarded = usePracticeStore.getState().currentSession;
    if (guarded && guarded.practiceId === 'box-breathing') {
      // PracticeSessionScreen skips startSession
    }
    expect(usePracticeStore.getState().currentSession!.before).toEqual({
      stress: 5, bodyTension: 4, mentalNoise: 6,
    });
  });

  it('reliefDelta is calculated correctly after feedback', () => {
    const { startSession, setBeforeScores, completeSession } = usePracticeStore.getState();

    startSession('cyclic-sigh', 'anger');
    setBeforeScores({ stress: 8, bodyTension: 7, mentalNoise: 9 });

    const after: CheckInScores = { stress: 4, bodyTension: 3, mentalNoise: 5 };
    completeSession(after, 'better', 'yes');

    const sessions = usePracticeStore.getState().sessions;
    expect(sessions).toHaveLength(1);

    const completed = sessions[0];
    expect(completed.completed).toBe(true);
    expect(completed.reliefDelta).toEqual({ stress: 4, bodyTension: 4, mentalNoise: 4 });
    expect(completed.feedbackShift).toBe('better');
    expect(completed.wouldUseAgain).toBe('yes');
  });

  it('userState is preserved through the session', () => {
    const { startSession, completeSession, setBeforeScores } = usePracticeStore.getState();

    startSession('feet-on-floor', 'panicLite');
    setBeforeScores({ stress: 9, bodyTension: 5, mentalNoise: 7 });

    const current = usePracticeStore.getState().currentSession;
    expect(current!.userState).toBe('panicLite');

    completeSession({ stress: 5, bodyTension: 3, mentalNoise: 4 }, 'better', 'yes');

    const completed = usePracticeStore.getState().sessions[0];
    expect(completed.userState).toBe('panicLite');
  });

  it('completeWithoutFeedback marks session as completed with feedbackSkipped', () => {
    const { startSession, setBeforeScores, completeWithoutFeedback } = usePracticeStore.getState();

    startSession('room-orientation', 'numb');
    setBeforeScores({ stress: 6, bodyTension: 4, mentalNoise: 7 });
    completeWithoutFeedback();

    const sessions = usePracticeStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed).toBe(true);
    expect(sessions[0].feedbackSkipped).toBe(true);
    expect(sessions[0].before).toEqual({ stress: 6, bodyTension: 4, mentalNoise: 7 });
    expect(sessions[0].after).toBeUndefined();
    expect(sessions[0].reliefDelta).toBeUndefined();
  });

  it('reliefDelta is undefined when before scores are not set', () => {
    const { startSession, completeSession } = usePracticeStore.getState();

    startSession('mini-pmr');
    completeSession({ stress: 3, bodyTension: 2, mentalNoise: 3 }, 'same', 'maybe');

    const completed = usePracticeStore.getState().sessions[0];
    expect(completed.reliefDelta).toBeUndefined();
    expect(completed.after).toEqual({ stress: 3, bodyTension: 2, mentalNoise: 3 });
  });

  it('abandonSession stores incomplete session', () => {
    const { startSession, abandonSession } = usePracticeStore.getState();

    startSession('box-breathing', 'focus');
    abandonSession();

    const sessions = usePracticeStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed).toBe(false);
    expect(sessions[0].practiceId).toBe('box-breathing');
    expect(usePracticeStore.getState().currentSession).toBeNull();
  });

  it('getLatestCompletedSession returns the most recent completed session', () => {
    const { startSession, completeWithoutFeedback, abandonSession } = usePracticeStore.getState();

    startSession('feet-on-floor', 'numb');
    completeWithoutFeedback();

    startSession('box-breathing', 'focus');
    abandonSession();

    startSession('micro-rest', 'burnout');
    usePracticeStore.getState().completeWithoutFeedback();

    const latest = usePracticeStore.getState().getLatestCompletedSession();
    expect(latest).toBeDefined();
    expect(latest!.practiceId).toBe('micro-rest');
  });

  it('getRecentSessions returns sessions in reverse order', () => {
    const { startSession, completeWithoutFeedback } = usePracticeStore.getState();

    startSession('feet-on-floor', 'numb');
    completeWithoutFeedback();
    startSession('box-breathing', 'focus');
    usePracticeStore.getState().completeWithoutFeedback();

    const recent = usePracticeStore.getState().getRecentSessions(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].practiceId).toBe('box-breathing');
    expect(recent[1].practiceId).toBe('feet-on-floor');
  });
});

describe('practiceStore - favorites', () => {
  beforeEach(() => {
    usePracticeStore.setState({ sessions: [], currentSession: null, favoritePracticeIds: [] });
  });

  it('toggleFavorite adds a practice to favorites', () => {
    usePracticeStore.getState().toggleFavorite('long-exhale-reset');
    expect(usePracticeStore.getState().favoritePracticeIds).toContain('long-exhale-reset');
  });

  it('toggleFavorite removes a practice from favorites', () => {
    usePracticeStore.getState().toggleFavorite('long-exhale-reset');
    usePracticeStore.getState().toggleFavorite('long-exhale-reset');
    expect(usePracticeStore.getState().favoritePracticeIds).not.toContain('long-exhale-reset');
  });

  it('can have multiple favorites', () => {
    usePracticeStore.getState().toggleFavorite('long-exhale-reset');
    usePracticeStore.getState().toggleFavorite('box-breathing');
    expect(usePracticeStore.getState().favoritePracticeIds).toEqual(['long-exhale-reset', 'box-breathing']);
  });
});

describe('PracticeSessionScreen guard — does not restart session', () => {
  beforeEach(() => {
    usePracticeStore.setState({ sessions: [], currentSession: null, favoritePracticeIds: [] });
  });

  it('simulates the screen guard: skips startSession when currentSession.practiceId matches', () => {
    const { startSession, setBeforeScores } = usePracticeStore.getState();

    startSession('long-exhale-reset', 'anxiety');
    setBeforeScores({ stress: 8, bodyTension: 7, mentalNoise: 9 });

    const practiceId = 'long-exhale-reset';
    const currentSession = usePracticeStore.getState().currentSession;
    const shouldStart = !currentSession || currentSession.practiceId !== practiceId;
    expect(shouldStart).toBe(false);

    expect(usePracticeStore.getState().currentSession!.before).toEqual({
      stress: 8, bodyTension: 7, mentalNoise: 9,
    });
  });

  it('starts a new session when practiceId does not match', () => {
    const { startSession, setBeforeScores } = usePracticeStore.getState();

    startSession('box-breathing', 'focus');
    setBeforeScores({ stress: 5, bodyTension: 4, mentalNoise: 6 });

    const practiceId = 'cyclic-sigh';
    const currentSession = usePracticeStore.getState().currentSession;
    const shouldStart = !currentSession || currentSession.practiceId !== practiceId;
    expect(shouldStart).toBe(true);

    startSession(practiceId, 'anger');
    expect(usePracticeStore.getState().currentSession!.practiceId).toBe('cyclic-sigh');
    expect(usePracticeStore.getState().currentSession!.before).toBeUndefined();
  });

  it('starts a new session when no currentSession exists', () => {
    const practiceId = 'feet-on-floor';
    const currentSession = usePracticeStore.getState().currentSession;
    const shouldStart = !currentSession || currentSession.practiceId !== practiceId;
    expect(shouldStart).toBe(true);
  });
});
