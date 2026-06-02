/**
 * Real Database Integration Tests
 *
 * These tests run against a real PostgreSQL instance (docker-compose.test.yml)
 * and verify actual FK constraints, cascade/restrict behavior, and data persistence.
 *
 * Prerequisites:
 *   docker-compose -f docker-compose.test.yml up -d
 *   npx prisma db push --schema=prisma/schema.prisma
 *   npx prisma db seed
 *
 * Run:
 *   npm run test:db
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5433/cadence_test',
    },
  },
});

describe('Real DB Integration Tests', () => {
  let testUserId: string;
  let testProtocolId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Seed test protocol
    const protocol = await prisma.protocol.upsert({
      where: { name: 'Test Protocol' },
      create: {
        name: 'Test Protocol',
        duration_seconds: 60,
        instruction_text: 'Test instruction',
        animation_type: 'breathing_circle',
      },
      update: {},
    });
    testProtocolId = protocol.id;

    // Create test user
    testUserId = randomUUID();
    await prisma.user.create({ data: { id: testUserId } });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.interventionLog.deleteMany({ where: { user_id: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.protocol.deleteMany({ where: { name: 'Test Protocol' } });
    await prisma.$disconnect();
  });

  describe('Intervention log persistence round-trip', () => {
    it('creates a log and reads it back with matching fields', async () => {
      const log = await prisma.interventionLog.create({
        data: {
          user_id: testUserId,
          protocol_id: testProtocolId,
          trigger_context: 'real test context',
          feedback_result: 'better',
          completed_fully: true,
          actual_duration_seconds: 45,
        },
      });

      expect(log.id).toBeTruthy();
      expect(log.created_at).toBeInstanceOf(Date);
      expect(log.user_id).toBe(testUserId);
      expect(log.protocol_id).toBe(testProtocolId);
      expect(log.trigger_context).toBe('real test context');
      expect(log.feedback_result).toBe('better');
      expect(log.completed_fully).toBe(true);
      expect(log.actual_duration_seconds).toBe(45);

      // Read back
      const fetched = await prisma.interventionLog.findUnique({ where: { id: log.id } });
      expect(fetched).toEqual(log);
    });
  });

  describe('Cascade delete: User → InterventionLogs', () => {
    it('deleting a user removes all their intervention logs', async () => {
      const userId = randomUUID();
      await prisma.user.create({ data: { id: userId } });

      // Create logs for this user
      await prisma.interventionLog.create({
        data: {
          user_id: userId,
          protocol_id: testProtocolId,
          trigger_context: 'cascade test 1',
          feedback_result: 'no_change',
        },
      });
      await prisma.interventionLog.create({
        data: {
          user_id: userId,
          protocol_id: testProtocolId,
          trigger_context: 'cascade test 2',
          feedback_result: 'worse',
        },
      });

      // Verify logs exist
      const logsBefore = await prisma.interventionLog.findMany({ where: { user_id: userId } });
      expect(logsBefore).toHaveLength(2);

      // Delete user — cascade should remove logs
      await prisma.user.delete({ where: { id: userId } });

      // Verify logs are gone
      const logsAfter = await prisma.interventionLog.findMany({ where: { user_id: userId } });
      expect(logsAfter).toHaveLength(0);
    });
  });

  describe('Restrict delete: Protocol with logs cannot be deleted', () => {
    it('attempting to delete a protocol with existing logs throws', async () => {
      // testProtocolId already has logs from previous test
      await expect(
        prisma.protocol.delete({ where: { id: testProtocolId } }),
      ).rejects.toThrow();
    });
  });

  describe('Unique constraint on Protocol.name', () => {
    it('creating a protocol with duplicate name throws', async () => {
      await expect(
        prisma.protocol.create({
          data: {
            name: 'Test Protocol', // already exists
            duration_seconds: 30,
            instruction_text: 'duplicate',
            animation_type: 'box_square',
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('FK constraint on protocol_id', () => {
    it('creating a log with non-existent protocol_id throws', async () => {
      await expect(
        prisma.interventionLog.create({
          data: {
            user_id: testUserId,
            protocol_id: randomUUID(), // doesn't exist
            trigger_context: 'fk test',
            feedback_result: 'better',
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('FK constraint on user_id', () => {
    it('creating a log with non-existent user_id throws', async () => {
      await expect(
        prisma.interventionLog.create({
          data: {
            user_id: randomUUID(), // doesn't exist
            protocol_id: testProtocolId,
            trigger_context: 'fk test',
            feedback_result: 'better',
          },
        }),
      ).rejects.toThrow();
    });
  });
});
