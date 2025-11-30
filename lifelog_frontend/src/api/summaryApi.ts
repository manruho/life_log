import { DailySummary } from "../types/Summary";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function fetchSummary(range = "7d"): Promise<DailySummary[]> {
  const res = await fetch(`${API_BASE}/api/summary?range=${range}`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}
