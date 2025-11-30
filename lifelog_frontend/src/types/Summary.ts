export interface DailySummary {
  date: string;
  sleep_hours: number;
  nap_total_minutes: number;
  nap_count: number;
  study_hours: number;
  mood_avg: number | null;
  condition_avg: number | null;
  wake_satisfaction_avg: number | null;
  sleep_start_hour: number | null;
  sleep_start_time: string | null;
  second_sleep: boolean;
}
