import { API_BASE } from "./baseUrl";
import { DailySummary } from "../types/Summary";

export async function fetchSummary(range = "7d"): Promise<DailySummary[]> {
  const res = await fetch(`${API_BASE}/api/summary?range=${range}`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}
