import { LifelogEvent, NewEventPayload } from "../types/Event";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function fetchEvents(date: string): Promise<LifelogEvent[]> {
  const res = await fetch(`${API_BASE}/api/events?date=${date}`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function createEvent(payload: NewEventPayload & { event_type: LifelogEvent["event_type"]; timestamp?: string }) {
  const res = await fetch(`${API_BASE}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

export async function deleteEvent(id: number) {
  const res = await fetch(`${API_BASE}/api/events/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete event");
  return res.json();
}
