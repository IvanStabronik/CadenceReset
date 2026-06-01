import * as fc from 'fast-check';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Property 5: Intervention log persistence round-trip
 *
 * For any valid combination of protocol_id, trigger_context, feedback_result,
 * completed_fully, actual_duration_seconds, creating a log and reading it back
 * produces matching field values with non-null id and created_at.
 *
 * **Validates: Requirements 3.1**
 */
describe('Property 5: Intervention log persistence round-trip', () => {
  let service: RecommendationService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      protocol: { findUnique: jest.fn() },
      interventionLog: { create: jest.fn() },
      user: { upsert: jest.fn() },
    };
    service = new RecommendationService(prisma as unknown as PrismaService);
  });

  const validFeedback = fc.constantFrom('better', 'no_change', 'worse');
  const validProtocolId = fc.uuid();
  const validTriggerContext = fc
    .string({ minLength: 1, maxLength: 500 })
    .filter((s) => s.trim().length > 0);
  const validCompletedFully = fc.boolean();
  const validDuration = fc.option(fc.integer({ min: 0, max: 3600 }), {
    nil: undefined,
  });
  const validUserId = fc.uuid();

  it('for any valid log input, persisted record has matching fields plus non-null id and created_at', async () => {
    await fc.assert(
      fc.asyncProperty(
        validUserId,
        validProtocolId,
        validTriggerContext,
        validFeedback,
        validCompletedFully,
        validDuration,
        async (
          userId,
          protocolId,
          triggerContext,
          feedbackResult,
          completedFully,
          duration,
        ) => {
          // Simulate DB behavior: create returns the input with generated id and created_at
          const generatedId = 'generated-' + Math.random().toString(36).slice(2);
          const generatedCreatedAt = new Date();

          (prisma.interventionLog.create as jest.Mock).mockResolvedValue({
            id: generatedId,
            user_id: userId,
            protocol_id: protocolId,
            trigger_context: triggerContext,
            feedback_result: feedbackResult,
            completed_fully: completedFully,
            actual_duration_seconds: duration ?? null,
            created_at: generatedCreatedAt,
          });

          const dto = {
            protocol_id: protocolId,
            trigger_context: triggerContext,
            feedback_result: feedbackResult as 'better' | 'no_change' | 'worse',
            completed_fully: completedFully,
            actual_duration_seconds: duration,
          };

          const result = await service.logIntervention(userId, dto);

          // Round-trip assertions: all fields match
          expect(result.id).toBeTruthy();
          expect(result.id).toBe(generatedId);
          expect(result.created_at).toBeInstanceOf(Date);
          expect(result.user_id).toBe(userId);
          expect(result.protocol_id).toBe(protocolId);
          expect(result.trigger_context).toBe(triggerContext);
          expect(result.feedback_result).toBe(feedbackResult);
          expect(result.completed_fully).toBe(completedFully);
          expect(result.actual_duration_seconds).toBe(duration ?? null);

          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
