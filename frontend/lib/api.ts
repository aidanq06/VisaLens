import type { CaseDiff, StudentContext, VisaLensAnalysis } from "@/types/analysis";

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

export type ClarificationResult = {
  updated_analysis: VisaLensAnalysis;
  case_diff: CaseDiff;
};

/** The living-case update: send the original analysis plus a pasted
 *  organizer/advisor reply, get the re-analysis and a before/after diff. */
export async function analyzeClarification(
  originalAnalysis: VisaLensAnalysis,
  clarificationText: string,
  source: "organizer" | "advisor" | "system" = "organizer",
  studentStatus: string = "F-1"
): Promise<ClarificationResult> {
  const res = await fetch(`${API_BASE}/api/analyze-clarification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      original_analysis: originalAnalysis,
      clarification_text: clarificationText,
      clarification_source: source,
      student_status: studentStatus,
    }),
  });
  if (!res.ok) {
    throw new Error(`Clarification service returned ${res.status}`);
  }
  return (await res.json()) as ClarificationResult;
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
