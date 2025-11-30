export type EventType =
  | "sleep_start"
  | "wake_up"
  | "mood"
  | "nap_start"
  | "nap_end"
  | "study_summary";

export interface LifelogEvent {
  id?: number;
  event_type: EventType;
  timestamp: string;
  date_key: string;
  mood?: number;
  condition?: number;
  wake_satisfaction?: number;
  second_sleep?: number | boolean;
  study_hours?: number;
  note?: string;
  extra_json?: any;
}

export type NewEventPayload = Omit<LifelogEvent, "id" | "date_key" | "timestamp"> & {
  timestamp?: string;
};
