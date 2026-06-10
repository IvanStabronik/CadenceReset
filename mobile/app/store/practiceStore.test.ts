import { usePracticeStore } from './practiceStore';
import { CheckInScores } from '../features/practices/types';

describe('practiceStore - session lifecycle', () => {
  beforeEach(() => {
    usePracticeStore.setState({ sessions: [], currentSession: null });
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

    // BeforeCheckIn starts session and sets scores
    startSession('box-breathing', 'focus');
    setBeforeScores({ stress: 5, bodyTension: 4, mentalNoise: 6 });

    // Simulate the guard in PracticeSessionScreen:
    // if currentSession.practiceId === practiceId → skip startSession
    const current = usePracticeStore.getState().currentSession;
    expect(current!.practiceId).toBe('box-breathing');

    // Calling startSession again for the SAME practiceId would wipe before scores
    // So we verify: if we DID accidentally call it again, before would be lost
    startSession('box-breathing', 'focus');
    const overwritten = usePracticeStore.getState().currentSession;
    expect(overwritten!.before).toBeUndefined(); // proves the guard is necessary

    // Now test the correct path: start, set scores, and DON'T call startSession again
    usePracticeStore.setState({ sessions: [], currentSession: null });
    startSession('box-breathing', 'focus');
    usePracticeStore.getState().setBeforeScores({ stress: 5, bodyTension: 4, mentalNoise: 6 });

    // Guard check: session exists for this practiceId → do not restart
    const guarded = usePracticeStore.getState().currentSession;
    if (guarded && guarded.practiceId === 'box-breathing') {
      // This is what PracticeSessionScreen does — skip startSession
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
    // No setBeforeScores call (user skipped check-in)

    completeSession({ stress: 3, bodyTension: 2, mentalNoise: 3 }, 'same', 'maybe');

    const completed = usePracticeStore.getState().sessions[0];
    expect(completed.reliefDelta).toBeUndefined();
    expect(completed.after).toEqual({ stress: 3, bodyTension: 2, mentalNoise: 3 });
  });
});


describe('PracticeSessionScreen guard — does not restart session', () => {
  beforeEach(() => {
    usePracticeStore.setState({ sessions: [], currentSession: null });
  });

  it('simulates the screen guard: skips startSession when currentSession.practiceId matches', () => {
    const { startSession, setBeforeScores } = usePracticeStore.getState();

    // Step 1: BeforeCheckIn flow already started a session and set scores
    startSession('long-exhale-reset', 'anxiety');
    setBeforeScores({ stress: 8, bodyTension: 7, mentalNoise: 9 });

    // Step 2: PracticeSessionScreen mounts — it checks the guard
    const practiceId = 'long-exhale-reset';
    const currentSession = usePracticeStore.getState().currentSession;

    // This is the exact guard from PracticeSessionScreen:
    // if (!currentSession || currentSession.practiceId !== practice.id) { startSession(...) }
    const shouldStart = !currentSession || currentSession.practiceId !== practiceId;
    expect(shouldStart).toBe(false); // guard prevents restart

    // before scores are still intact
    expect(usePracticeStore.getState().currentSession!.before).toEqual({
      stress: 8, bodyTension: 7, mentalNoise: 9,
    });
  });

  it('starts a new session when practiceId does not match', () => {
    const { startSession, setBeforeScores } = usePracticeStore.getState();

    // Session already exists for a different practice
    startSession('box-breathing', 'focus');
    setBeforeScores({ stress: 5, bodyTension: 4, mentalNoise: 6 });

    // Navigate to a different practice
    const practiceId = 'cyclic-sigh';
    const currentSession = usePracticeStore.getState().currentSession;

    const shouldStart = !currentSession || currentSession.practiceId !== practiceId;
    expect(shouldStart).toBe(true); // different practice, must start new session

    // Start the new session (as PracticeSessionScreen would)
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
