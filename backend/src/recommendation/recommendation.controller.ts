import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MatchRequestDto } from './dto/match-request.dto';
import { LogRequestDto } from './dto/log-request.dto';
import { Protocol, InterventionLog } from '@prisma/client';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class RecommendationController {
  constructor(private readonly service: RecommendationService) {}

  @Post('recommendation/match')
  @HttpCode(200)
  async match(@Body() dto: MatchRequestDto): Promise<Protocol> {
    return this.service.matchProtocol(dto.trigger_context);
  }

  @Post('log')
  @HttpCode(201)
  async log(
    @CurrentUser() userId: string,
    @Body() dto: LogRequestDto,
  ): Promise<InterventionLog> {
    return this.service.logIntervention(userId, dto);
  }
}
