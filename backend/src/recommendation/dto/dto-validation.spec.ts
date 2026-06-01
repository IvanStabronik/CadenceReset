import * as fc from 'fast-check';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MatchRequestDto } from './match-request.dto';
import { LogRequestDto } from './log-request.dto';

describe('DTO property tests', () => {
  /**
   * Property 4: Whitespace-only trigger contexts are rejected
   * **Validates: Requirements 2.4, 4.6**
   */
  describe('Property 4: Whitespace-only trigger contexts are rejected', () => {
    const whitespaceOnly = fc.stringOf(
      fc.constantFrom(' ', '\t', '\n', '\r'),
      { minLength: 1, maxLength: 50 },
    );

    it('whitespace-only trigger_context fails validation after transform', async () => {
      await fc.assert(
        fc.asyncProperty(whitespaceOnly, async (input) => {
          const dto = plainToInstance(MatchRequestDto, {
            trigger_context: input,
          });
          const errors = await validate(dto);
          return errors.length > 0;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 6: Invalid feedback_result values are rejected
   * **Validates: Requirements 3.5**
   */
  describe('Property 6: Invalid feedback_result values are rejected', () => {
    const validValues = ['better', 'no_change', 'worse'];
    const invalidFeedback = fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => !validValues.includes(s));

    it('invalid feedback_result values fail validation', async () => {
      await fc.assert(
        fc.asyncProperty(invalidFeedback, async (input) => {
          const dto = plainToInstance(LogRequestDto, {
            protocol_id: '550e8400-e29b-41d4-a716-446655440000',
            trigger_context: 'some context',
            feedback_result: input,
            completed_fully: true,
            actual_duration_seconds: 60,
          });
          const errors = await validate(dto);
          const feedbackError = errors.find(
            (e) => e.property === 'feedback_result',
          );
          return feedbackError !== undefined;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7: DTO whitespace trimming is applied consistently
   * **Validates: Requirements 4.6, 4.7**
   */
  describe('Property 7: DTO whitespace trimming is applied consistently', () => {
    const nonEmptyContent = fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0);
    const whitespace = fc.stringOf(fc.constantFrom(' ', '\t'), {
      minLength: 1,
      maxLength: 5,
    });

    const paddedString = fc
      .tuple(whitespace, nonEmptyContent, whitespace)
      .map(([pre, content, post]) => `${pre}${content}${post}`);

    it('leading/trailing whitespace is trimmed after transform', async () => {
      await fc.assert(
        fc.asyncProperty(paddedString, async (input) => {
          const dto = plainToInstance(MatchRequestDto, {
            trigger_context: input,
          });
          // After transform, value should be trimmed and lowercased
          return dto.trigger_context === input.trim().toLowerCase();
        }),
        { numRuns: 100 },
      );
    });
  });
});
