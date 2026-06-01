export class LogResponseDto {
  id: string;
  user_id: string;
  protocol_id: string;
  trigger_context: string;
  feedback_result: string;
  completed_fully: boolean;
  actual_duration_seconds: number | null;
  created_at: Date;
}
