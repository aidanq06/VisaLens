import type { VisaLensAnalysis } from "@/types/analysis";
import { extractOpportunity } from "@/lib/analyze/phraseRules";
import { calculateRisk, type StudentStatus } from "@/lib/analyze/riskScoring";
import { buildGraphFromRisk } from "@/lib/graphBuilder";
import {
  DEFAULT_TIMELINE_INPUTS,
  simulateTimeline,
  toTimelineAnalysis,
} from "@/lib/timelineSimulator";
import { generateVerificationKit } from "@/lib/verification/generateVerificationKit";

/**
 * The full VisaLens pipeline, runnable entirely in the browser:
 *
 *   raw text
 *     → extraction (phrase rules + evidence)
 *     → deterministic risk scoring
 *     → blocker graph
 *     → timeline simulation
 *     → verification kit
 *     → complete VisaLensAnalysis
 *
 * This is what makes the demo unkillable: no network, no API keys, no
 * latency. The backend /analyze endpoint can later return the same shape
 * (with LLM-grade extraction) and the dashboard won't know the difference.
 */

export type AnalyzeRequest = {
  text: string;
  studentStatus?: StudentStatus;
  opportunityType?: string;
};

export function analyzeOpportunity(
  request: AnalyzeRequest,
  today: Date = new Date()
): VisaLensAnalysis {
  const studentStatus = request.studentStatus ?? "f1";

  // 1. Extraction
  const extracted = extractOpportunity(request.text, request.opportunityType);

  // 2. Risk scoring (deterministic rules)
  const risk = calculateRisk(extracted, studentStatus, today);

  // 3. Blocker graph (derived from risk categories)
  const graph = buildGraphFromRisk({ risk });

  // 4. Timeline simulation
  const timelineResult = simulateTimeline(
    extracted.deadline_or_start_date,
    DEFAULT_TIMELINE_INPUTS,
    today
  );
  const timeline = toTimelineAnalysis(extracted.deadline_or_start_date, timelineResult);

  // 5. Verification kit (mapped back to the shared schema shape)
  const kit = generateVerificationKit({ extracted, risk, timeline });
  const verification = {
    organizer_questions: kit.organizerQuestions,
    advisor_questions: kit.advisorQuestions,
    email_draft: kit.emailDraft,
    next_steps: kit.nextSteps,
    disclaimer: kit.disclaimer,
  };

  return { extracted, risk, graph, timeline, verification };
}

// ---------------------------------------------------------------------------
// Session storage handoff (scanner page -> results page)
// ---------------------------------------------------------------------------

const STORAGE_KEY = "visalens:analysis";

export type StoredAnalysis = {
  analysis: VisaLensAnalysis;
  originalText: string;
  studentStatus: StudentStatus;
  analyzedAt: string;
};

export function storeAnalysis(stored: StoredAnalysis): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Session storage unavailable (private mode etc.) — results page
    // will fall back to the demo analysis.
  }
}

export function loadStoredAnalysis(): StoredAnalysis | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAnalysis) : null;
  } catch {
    return null;
  }
}
