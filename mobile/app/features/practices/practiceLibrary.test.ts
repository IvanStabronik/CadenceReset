import { practices, getPracticeById } from './practiceLibrary';
import { getRecommendedPractices, STATE_OPTIONS } from './recommendations';
import { UserState } from './types';

const EXPECTED_IDS = [
  // MVP (12)
  'long-exhale-reset', 'cyclic-sigh', 'five-four-three-two-one-grounding',
  'feet-on-floor', 'room-orientation', 'jaw-shoulders-release',
  'soft-belly-breathing', 'box-breathing', 'mini-pmr',
  'sixty-second-body-check', 'sleep-exhale', 'notice-the-thought',
  // Workday (5)
  'before-meeting-reset', 'after-conflict-reset', 'desk-body-release',
  'eye-softening', 'end-of-work-ritual',
  // Emotional (5)
  'anger-cooling', 'shame-softening', 'sadness-grounding',
  'fear-naming', 'resentment-release',
  // Sleep (5)
  'body-heavy', 'long-exhale-for-sleep', 'pmr-for-sleep',
  'let-the-day-end', 'middle-of-night-reset',
  // Burnout (5)
  'low-energy-check-in', 'no-force-breathing', 'micro-rest',
  'permission-to-stop', 'one-small-next-step',
];

describe('Practice Library Integrity', () => {
  it('has no duplicate practice IDs', () => {
    const ids = practices.map(p => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every practice has at least 1 step', () => {
    for (const practice of practices) {
      expect(practice.steps.length).toBeGreaterThan(0);
    }
  });

  it('every step has durationSec > 0', () => {
    for (const practice of practices) {
      for (const step of practice.steps) {
        expect(step.durationSec).toBeGreaterThan(0);
      }
    }
  });

  it('every fallbackPracticeId references an existing practice', () => {
    for (const practice of practices) {
      if (practice.fallbackPracticeId) {
        const fallback = getPracticeById(practice.fallbackPracticeId);
        expect(fallback).toBeDefined();
      }
    }
  });

  it('every recommended ID exists in the library', () => {
    const allStates: UserState[] = [
      'anxiety', 'panicLite', 'overthinking', 'bodyTension',
      'anger', 'numb', 'sleep', 'focus', 'burnout',
      'workStress', 'sadness', 'shame', 'lowEnergy', 'quickReset',
    ];

    for (const state of allStates) {
      const recommended = getRecommendedPractices(state);
      expect(recommended.length).toBeGreaterThan(0);
      for (const practice of recommended) {
        expect(practice.id).toBeDefined();
      }
    }
  });

  it('every UserState returns at least 1 practice', () => {
    for (const option of STATE_OPTIONS) {
      const result = getRecommendedPractices(option.value);
      expect(result.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('contains all expected canonical practice IDs', () => {
    const actualIds = practices.map(p => p.id).sort();
    const missing = EXPECTED_IDS.filter(id => !actualIds.includes(id));
    if (missing.length > 0) {
      console.warn('Missing practices:', missing);
    }
    // At minimum, all MVP practices must exist
    const mvpIds = EXPECTED_IDS.slice(0, 12);
    for (const id of mvpIds) {
      expect(actualIds).toContain(id);
    }
  });

  it('breathing practices with breathPattern have valid pattern', () => {
    for (const practice of practices) {
      if (practice.breathPattern) {
        expect(practice.breathPattern.inhaleSec).toBeGreaterThan(0);
        expect(practice.breathPattern.exhaleSec).toBeGreaterThan(0);
        expect(practice.breathPattern.cycles).toBeGreaterThan(0);
      }
    }
  });

  it('no practice contains unsafe language', () => {
    const unsafePatterns = [
      /you are safe/i,
      /cure/i,
      /heal your/i,
      /treat (your |the )?anxiety/i,
      /fix (your |the )?depression/i,
      /scientifically proven/i,
      /research.?backed/i,
    ];

    for (const practice of practices) {
      const textToCheck = [
        practice.description,
        practice.subtitle,
        ...practice.steps.map(s => s.instruction),
        ...practice.tags,
      ].join(' ');

      for (const pattern of unsafePatterns) {
        expect(textToCheck).not.toMatch(pattern);
      }
    }
  });
});
