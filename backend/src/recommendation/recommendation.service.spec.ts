import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      protocol: {
        findUnique: jest.fn(),
      },
      interventionLog: {
        create: jest.fn(),
      },
      user: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    prisma = module.get(PrismaService);
  });

  describe('matchProtocol', () => {
    it('should return protocol when found in database', async () => {
      const mockProtocol = {
        id: 'proto-1',
        name: 'Physiological Sigh',
        duration_seconds: 60,
        instruction_text: 'Breathe...',
        animation_type: 'breathing_circle',
        audio_guide_url: null,
      };
      (prisma.protocol.findUnique as jest.Mock).mockResolvedValue(mockProtocol);

      const result = await service.matchProtocol('stressful meeting today');
      expect(result).toEqual(mockProtocol);
      expect(prisma.protocol.findUnique).toHaveBeenCalledWith({
        where: { name: 'Physiological Sigh' },
      });
    });

    it('should throw NotFoundException when protocol not found in DB', async () => {
      (prisma.protocol.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.matchProtocol('random context')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('logIntervention', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const dto = {
      protocol_id: 'proto-1',
      trigger_context: 'meeting stress',
      feedback_result: 'better' as const,
      completed_fully: true,
      actual_duration_seconds: 55,
    };

    it('should create intervention log on optimistic path (user exists)', async () => {
      const mockLog = { id: 'log-1', ...dto, user_id: userId, created_at: new Date() };
      (prisma.interventionLog.create as jest.Mock).mockResolvedValue(mockLog);

      const result = await service.logIntervention(userId, dto);
      expect(result).toEqual(mockLog);
      expect(prisma.interventionLog.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.upsert).not.toHaveBeenCalled();
    });

    it('should upsert user and retry on P2003 FK violation', async () => {
      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.0.0', meta: { field_name: 'user_id' } },
      );
      const mockLog = { id: 'log-1', ...dto, user_id: userId, created_at: new Date() };

      (prisma.interventionLog.create as jest.Mock)
        .mockRejectedValueOnce(p2003Error)
        .mockResolvedValueOnce(mockLog);
      (prisma.user.upsert as jest.Mock).mockResolvedValue({ id: userId, created_at: new Date() });

      const result = await service.logIntervention(userId, dto);
      expect(result).toEqual(mockLog);
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { id: userId },
        create: { id: userId },
        update: {},
      });
      expect(prisma.interventionLog.create).toHaveBeenCalledTimes(2);
    });

    it('should re-throw non-P2003 Prisma errors', async () => {
      const otherError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0', meta: { target: ['name'] } },
      );
      (prisma.interventionLog.create as jest.Mock).mockRejectedValue(otherError);

      await expect(service.logIntervention(userId, dto)).rejects.toThrow(otherError);
      expect(prisma.user.upsert).not.toHaveBeenCalled();
    });

    it('should re-throw unexpected non-Prisma errors', async () => {
      const genericError = new Error('Something went wrong');
      (prisma.interventionLog.create as jest.Mock).mockRejectedValue(genericError);

      await expect(service.logIntervention(userId, dto)).rejects.toThrow(genericError);
      expect(prisma.user.upsert).not.toHaveBeenCalled();
    });
  });
});
