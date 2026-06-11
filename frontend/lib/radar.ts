import type { VisaLensAnalysis } from "@/types/analysis";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type RadarView = "apply_now" | "found_today" | "source_of_truth" | "all";

export type RadarOpportunity = {
  id: number;
  company_name: string;
  title: string;
  location: string;
  remote: number;
  season: string | null;
  apply_url: string;
  source_type: string;
  is_source_of_truth: number;
  posted_at: string | null;
  first_seen_at: string;
  fit_score: number;
  freshness_score: number;
  urgency_score: number;
  visa_risk_score: number | null;
  visa_risk_level: string | null;
  found_early: number;
  status: string;
};

export type RadarSource = {
  id: number;
  company_name: string | null;
  source_type: string;
  identifier: string;
  url: string;
  tier: number;
  active: number;
  reliability_score: number;
  freshness_score: number;
  priority_score: number;
  consecutive_failures: number;
  last_checked_at: string | null;
  last_new_posting_at: string | null;
  next_check_at: string | null;
  opportunity_count: number;
};

export type RadarStats = {
  opportunities: number;
  found_today: number;
  apply_now: number;
  source_of_truth: number;
  found_early: number;
  active_sources: number;
  pending_discoveries: number;
  alerts_sent: number;
};

export type ActionLabel =
  | "apply_now"
  | "verify_first"
  | "ask_advisor"
  | "watch"
  | "likely_blocked"
  | "low_priority";

export type ActionItem = RadarOpportunity & {
  has_analysis: boolean;
  action_label: ActionLabel;
  action_title: string;
  action_score: number;
  reasons: string[];
  score_reasons: string[];
  next_steps: string[];
};

export type ActionQueue = {
  counts: Record<ActionLabel, number>;
  total: number;
  estimated_minutes_saved: number;
  items: ActionItem[];
};

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchOpportunities = (view: RadarView) =>
  getJSON<RadarOpportunity[]>(`/api/radar/opportunities?view=${view}&limit=200`);

export const fetchSources = () => getJSON<RadarSource[]>("/api/radar/sources");

export const fetchActionQueue = () =>
  getJSON<ActionQueue>("/api/radar/action-queue?limit=300");

export const fetchStats = () => getJSON<RadarStats>("/api/radar/stats");

export const fetchOpportunityAnalysis = (id: number) =>
  getJSON<VisaLensAnalysis>(`/api/radar/opportunities/${id}/analysis`);

export async function triggerScan(): Promise<{ checked: number; new_opportunities: number }> {
  const res = await fetch(`${API_BASE}/api/radar/scan`, { method: "POST" });
  if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
  return res.json();
}

export async function markStatus(id: number, status: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/radar/opportunities/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
}
