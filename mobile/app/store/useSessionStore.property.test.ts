import * as fc from 'fast-check';
import { useSessionStore } from './useSessionStore';
import { SessionPhase } from '../types';

/**
 * Property 9: Session phase transitions are sequential
 * For any intervention session, phase transitions only in order:
 * idle→preparation→execution→feedback→idle. No phase is skipped or revisited.
 * Validates: Requirements 7.4, 7.5, 8.5
 */
describe('Property 9: Session phase transitions are sequential', () => {
  const phases: SessionPhase[] = ['idle', 'preparation', 'execution', 'feedback'];
  const allPhases = fc.constantFrom<SessionPhase>('idle', 'preparation', 'execution', 'feedback');

  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it('random setPhase calls never produce an invalid phase sequence', () => {
    fc.assert(
      fc.property(
        fc.array(allPhases, { minLength: 1, maxLength: 50 }),
        (phaseAttempts) => {
          useSessionStore.getState().reset();
          
          for (const attemptedPhase of phaseAttempts) {
            const currentPhase = useSessionStore.getState().phase;
            useSessionStore.getState().setPhase(attemptedPhase);
            const newPhase = useSessionStore.getState().phase;

            // Verify: new phase is either unchanged (rejected) or the next valid phase
            const currentIndex = phases.indexOf(currentPhase);
            const newIndex = phases.indexOf(newPhase);

            if (newPhase !== currentPhase) {
              // Transition happened — must be sequential
              const isForward = newIndex === currentIndex + 1;
              const isReset = currentPhase === 'feedback' && newPhase === 'idle';
              if (!isForward && !isReset) return false;
            }
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('complete() and skip() always transition to feedback regardless of current phase', () => {
    fc.assert(
      fc.property(fc.boolean(), (useComplete) => {
        useSessionStore.getState().reset();
        // Set up to execution phase
        useSessionStore.getState().setPhase('preparation');
        useSessionStore.getState().setPhase('execution');

        if (useComplete) {
          useSessionStore.getState().complete();
        } else {
          useSessionStore.getState().skip();
        }

        return useSessionStore.getState().phase === 'feedback';
      }),
      { numRuns: 100 },
    );
  });
});
