import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class LogRequestDto {
  @IsUUID()
  protocol_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  trigger_context: string;

  @IsEnum(['better', 'no_change', 'worse'], {
    message: 'feedback_result must be one of: better, no_change, worse',
  })
  feedback_result: 'better' | 'no_change' | 'worse';

  @IsBoolean()
  @IsOptional()
  completed_fully?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  actual_duration_seconds?: number;
}
