import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class MatchRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'trigger_context is required' })
  @MaxLength(500, { message: 'trigger_context must not exceed 500 characters' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  trigger_context: string;
}
