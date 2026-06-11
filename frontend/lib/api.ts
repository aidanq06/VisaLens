import type { StudentContext, VisaLensAnalysis } from "@/types/analysis";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const ANALYSIS_STORAGE_KEY = "visalens:analysis";

export type AnalyzePayload = {
  title: string;
  text: string;
  context: StudentContext;
  deadlineOverride?: string;
};

/** Calls the backend pipeline. Throws on network/HTTP failure so callers
 *  can fall back to demo mode. */
export async function analyzeOpportunity(
  payload: AnalyzePayload
): Promise<VisaLensAnalysis> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        title: payload.title,
        text: payload.text,
        student_status: payload.context.status,
        school_level: payload.context.school_level,
        opportunity_type: payload.context.opportunity_type,
        deadline_override: payload.deadlineOverride || null,
      }),
    });
    if (!res.ok) {
      throw new Error(`Analysis service returned ${res.status}`);
    }
    return (await res.json()) as VisaLensAnalysis;
  } finally {
    clearTimeout(timeout);
  }
}

export function storeAnalysis(analysis: VisaLensAnalysis) {
  sessionStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysis));
}

export function loadStoredAnalysis(): VisaLensAnalysis | null {
  try {
    const raw = sessionStorage.getItem(ANALYSIS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VisaLensAnalysis) : null;
  } catch {
    return null;
  }
}
