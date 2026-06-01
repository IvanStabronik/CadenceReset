import { Injectable, NotFoundException } from '@nestjs/common';
import { Protocol, InterventionLog, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { matchTriggerContext } from './matching/keyword-matcher';
import { LogRequestDto } from './dto/log-request.dto';

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async matchProtocol(triggerContext: string): Promise<Protocol> {
    const protocolName = matchTriggerContext(triggerContext);

    const protocol = await this.prisma.protocol.findUnique({
      where: { name: protocolName },
    });

    if (!protocol) {
      throw new NotFoundException(
        `Protocol "${protocolName}" not found in database`,
      );
    }

    return protocol;
  }

  async logIntervention(
    userId: string,
    dto: LogRequestDto,
  ): Promise<InterventionLog> {
    const data = {
      user_id: userId,
      protocol_id: dto.protocol_id,
      trigger_context: dto.trigger_context,
      feedback_result: dto.feedback_result,
      completed_fully: dto.completed_fully ?? false,
      actual_duration_seconds: dto.actual_duration_seconds,
    };

    try {
      // Optimistic path: assume user exists (true for 99%+ of requests)
      return await this.prisma.interventionLog.create({ data });
    } catch (error) {
      // P2003 = Foreign key constraint violation on user_id
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003' &&
        (error.meta?.field_name as string)?.includes('user_id')
      ) {
        // First-time user: create user record, then retry
        await this.prisma.user.upsert({
          where: { id: userId },
          create: { id: userId },
          update: {},
        });

        return await this.prisma.interventionLog.create({ data });
      }
      // Re-throw unexpected errors (caught by PrismaExceptionFilter)
      throw error;
    }
  }
}
