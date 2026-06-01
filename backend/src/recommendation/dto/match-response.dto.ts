export class MatchResponseDto {
  id: string;
  name: string;
  duration_seconds: number;
  instruction_text: string;
  animation_type: string;
  audio_guide_url: string | null;
}
