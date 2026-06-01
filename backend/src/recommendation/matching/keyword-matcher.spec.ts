import * as fc from 'fast-check';
import { matchTriggerContext } from './keyword-matcher';
import { ProtocolName } from './protocol-name.enum';

describe('keyword-matcher property tests', () => {
  // Custom arbitraries — generate lowercased strings (input is pre-normalized)
  const safeString = fc
    .stringOf(fc.char().filter((c) => c >= ' ' && c <= '~'))
    .map((s) => s.toLowerCase());

  const triggerWithMeeting = fc
    .tuple(safeString, safeString)
    .map(([prefix, suffix]) => `${prefix}meeting${suffix}`);

  const triggerWithDeadline = fc
    .tuple(safeString, safeString)
    .map(([prefix, suffix]) => `${prefix}deadline${suffix}`);

  const triggerWithBoth = fc
    .tuple(safeString, safeString, safeString)
    .map(
      ([prefix, middle, suffix]) =>
        `${prefix}meeting${middle}deadline${suffix}`,
    );

  const triggerWithoutKeywords = safeString.filter(
    (s) => !s.includes('meeting') && !s.includes('deadline'),
  );

  /**
   * **Validates: Requirements 2.2, 5.2, 5.3, 5.6**
   */
  describe('Property 1: Keyword matching returns correct protocol', () => {
    it('strings containing "meeting" return PhysiologicalSigh', () => {
      fc.assert(
        fc.property(triggerWithMeeting, (context) => {
          const result = matchTriggerContext(context);
          return result === ProtocolName.PhysiologicalSigh;
        }),
        { numRuns: 100 },
      );
    });

    it('strings containing "deadline" (without "meeting") return BoxBreathing', () => {
      const deadlineOnly = triggerWithDeadline.filter(
        (s) => !s.includes('meeting'),
      );
      fc.assert(
        fc.property(deadlineOnly, (context) => {
          const result = matchTriggerContext(context);
          return result === ProtocolName.BoxBreathing;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Validates: Requirements 2.3, 5.5**
   */
  describe('Property 2: Default fallback for unmatched contexts', () => {
    it('strings without any keyword return BoxBreathing (default)', () => {
      fc.assert(
        fc.property(triggerWithoutKeywords, (context) => {
          const result = matchTriggerContext(context);
          return result === ProtocolName.BoxBreathing;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Validates: Requirements 2.5, 5.4**
   */
  describe('Property 3: Priority resolution for multiple keyword matches', () => {
    it('strings containing both "meeting" and "deadline" return PhysiologicalSigh (first rule wins)', () => {
      fc.assert(
        fc.property(triggerWithBoth, (context) => {
          const result = matchTriggerContext(context);
          return result === ProtocolName.PhysiologicalSigh;
        }),
        { numRuns: 100 },
      );
    });
  });
});
