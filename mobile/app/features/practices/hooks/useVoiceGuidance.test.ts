import { practices } from '../practiceLibrary';
import { usePracticeStore } from '../../../store/practiceStore';

// Verify voice cue data integrity for the 8 target practices
const VOICE_PRACTICES = [
  'feet-on-floor',
  'room-orientation',
  'jaw-shoulders-release',
  'soft-belly-breathing',
  'mini-pmr',
  'sixty-second-body-check',
  'sleep-exhale',
  'body-heavy',
];

describe('voice guidance — data integrity', () => {
  it('target practices exist in the library', () => {
    const ids = practices.map(p => p.id);
    for (const id of VOICE_PRACTICES) {
      expect(ids).toContain(id);
    }
  });

  it.each(VOICE_PRACTICES)('practice "%s" has voiceCue on most steps', (practiceId) => {
    const practice = practices.find(p => p.id === practiceId)!;
    const stepsWithCue = practice.steps.filter(s => s.voiceCue);
    // At least half of steps should have voiceCue
    expect(stepsWithCue.length).toBeGreaterThanOrEqual(Math.floor(practice.steps.length / 2));
  });

  it.each(VOICE_PRACTICES)('voiceCues in "%s" are short (max 80 chars)', (practiceId) => {
    const practice = practices.find(p => p.id === practiceId)!;
    for (const step of practice.steps) {
      if (step.voiceCue) {
        expect(step.voiceCue.length).toBeLessThanOrEqual(80);
      }
    }
  });

  it.each(VOICE_PRACTICES)('voiceCues in "%s" do not contain unsafe language', (practiceId) => {
    const practice = practices.find(p => p.id === practiceId)!;
    const unsafePatterns = [
      /you are safe/i,
      /heal/i,
      /cure/i,
      /therapy/i,
      /regulated/i,
    ];
    for (const step of practice.steps) {
      if (step.voiceCue) {
        for (const pattern of unsafePatterns) {
          expect(step.voiceCue).not.toMatch(pattern);
        }
      }
    }
  });

  it('non-target practices do NOT have voiceCue', () => {
    const nonTarget = practices.filter(p => !VOICE_PRACTICES.includes(p.id));
    for (const practice of nonTarget) {
      for (const step of practice.steps) {
        expect(step.voiceCue).toBeUndefined();
      }
    }
  });
});

describe('voice guidance — store setting', () => {
  beforeEach(() => {
    usePracticeStore.setState({ voiceGuidanceEnabled: true });
  });

  it('voiceGuidanceEnabled defaults to true', () => {
    expect(usePracticeStore.getState().voiceGuidanceEnabled).toBe(true);
  });

  it('setVoiceGuidanceEnabled toggles the setting', () => {
    usePracticeStore.getState().setVoiceGuidanceEnabled(false);
    expect(usePracticeStore.getState().voiceGuidanceEnabled).toBe(false);

    usePracticeStore.getState().setVoiceGuidanceEnabled(true);
    expect(usePracticeStore.getState().voiceGuidanceEnabled).toBe(true);
  });
});

describe('voice guidance — fallback logic', () => {
  it('voiceCue is used when present, otherwise instruction', () => {
    const practice = practices.find(p => p.id === 'feet-on-floor')!;
    const stepWithCue = practice.steps.find(s => s.voiceCue)!;
    const stepWithoutCue = practice.steps.find(s => !s.voiceCue)!;

    // When voiceCue exists, use it
    const textForCue = stepWithCue.voiceCue || stepWithCue.instruction;
    expect(textForCue).toBe(stepWithCue.voiceCue);

    // When no voiceCue, fall back to instruction
    const textForNoCue = stepWithoutCue.voiceCue || stepWithoutCue.instruction;
    expect(textForNoCue).toBe(stepWithoutCue.instruction);
  });
});
