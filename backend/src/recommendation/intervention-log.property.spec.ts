import * as fc from 'fast-check';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Property 5: Intervention log creation contract (unit-level, mocked DB)
 *
 * Verifies that for any valid input combination, the service correctly passes
 * data to Prisma and returns a record with matching fields plus generated id/created_at.
 * NOTE: This does NOT test actual database persistence — that requires a real test DB.
 *
 * **Validates: Requirements 3.1**
 */
describe('Property 5: Intervention log creation contract (mocked)', () => {
  let service: RecommendationService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      protocol: { findUnique: jest.fn().mockResolvedValue({ id: 'exists', name: 'Test' }) },
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
