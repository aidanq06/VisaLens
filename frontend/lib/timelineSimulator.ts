import type { RiskLevel, TimelineAnalysis } from "@/types/analysis";

/**
 * Timeline risk simulator (pure functions — easy to unit test and to
 * mirror in backend/services/workflow/timeline_simulator.py).
 */

export type TimelineInputs = {
  organizerResponseDays: number;
  advisorResponseDays: number;
  studentDecisionDays: number;
};

export const DEFAULT_TIMELINE_INPUTS: TimelineInputs = {
  organizerResponseDays: 2,
  advisorResponseDays: 2,
  studentDecisionDays: 1,
};

export type TimelineResult = {
  daysUntilDeadline: number | null;
  daysNeeded: number;
  riskLevel: RiskLevel;
  recommendation: string;
  /** Ordered verification steps with their day estimates. */
  steps: { label: string; days: number; owner: string }[];
  /** Latest calendar date the student should start asking questions. */
  latestAskDate: string | null;
  /** ISO date the verification chain would finish if started today. */
  verificationReadyDate: string;
};

/** Days from today (local midnight) until an ISO date. Null if unparseable. */
export function daysUntil(dateStr: string | null, today: Date = new Date()): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Core risk rules:
 *  - no deadline           -> low (but still recommend verifying)
 *  - deadline passed/today -> high
 *  - need > have           -> high
 *  - need == have, or within 2 days of have -> medium_high
 *  - within 5 days of have -> moderate
 *  - otherwise             -> low
 */
export function simulateTimeline(
  deadlineOrStartDate: string | null,
  inputs: TimelineInputs = DEFAULT_TIMELINE_INPUTS,
  today: Date = new Date()
): TimelineResult {
  const steps = [
    { label: "Organizer response", days: inputs.organizerResponseDays, owner: "organizer" },
    { label: "Advisor/DSO clarification", days: inputs.advisorResponseDays, owner: "advisor" },
    { label: "Student decision", days: inputs.studentDecisionDays, owner: "student" },
  ];
  const daysNeeded = steps.reduce((sum, s) => sum + s.days, 0);
  const daysAvailable = daysUntil(deadlineOrStartDate, today);
  const verificationReadyDate = formatDate(addDays(today, daysNeeded));

  if (daysAvailable === null) {
    return {
      daysUntilDeadline: null,
      daysNeeded,
      riskLevel: "low",
      recommendation:
        "No deadline detected. You still should verify eligibility before applying, but timing is not the main risk.",
      steps,
      latestAskDate: null,
      verificationReadyDate,
    };
  }

  let riskLevel: RiskLevel;
  let recommendation: string;
  const slack = daysAvailable - daysNeeded;
  const latestAskDate =
    slack >= 0 ? formatDate(addDays(today, slack)) : formatDate(today);

  if (daysAvailable <= 0) {
    riskLevel = "high";
    recommendation =
      "The deadline or start date has already arrived. Contact the organizer immediately to ask if late verification or applications are possible.";
  } else if (slack < 0) {
    riskLevel = "high";
    recommendation = `Verification needs about ${daysNeeded} days but only ${daysAvailable} remain. Ask the organizer right now and flag the deadline in your message.`;
  } else if (slack <= 2) {
    riskLevel = "medium_high";
    recommendation = `You have ${daysAvailable} days and verification may take ${daysNeeded}. Ask the organizer today — verification may take almost the entire remaining time.`;
  } else if (slack <= 5) {
    riskLevel = "moderate";
    recommendation = `You have ${daysAvailable} days and verification takes about ${daysNeeded}. Start verification by ${latestAskDate} to stay safe.`;
  } else {
    riskLevel = "low";
    recommendation = `You have ${daysAvailable} days — enough time to verify (about ${daysNeeded} days). Still, ask early: ${latestAskDate} is your latest safe start.`;
  }

  return {
    daysUntilDeadline: daysAvailable,
    daysNeeded,
    riskLevel,
    recommendation,
    steps,
    latestAskDate,
    verificationReadyDate,
  };
}

/**
 * Identify the bottleneck: the step with the largest day estimate
 * (first one wins ties — earlier steps block everything downstream).
 */
export function findBottleneck(result: TimelineResult) {
  return result.steps.reduce((max, s) => (s.days > max.days ? s : max), result.steps[0]);
}

/** Convert a simulation into the shared TimelineAnalysis shape. */
export function toTimelineAnalysis(
  deadlineOrStartDate: string | null,
  result: TimelineResult
): TimelineAnalysis {
  return {
    deadline_or_start_date: deadlineOrStartDate,
    days_until_deadline: result.daysUntilDeadline,
    estimated_verification_days: result.daysNeeded,
    risk_level: result.riskLevel,
    critical_path: result.steps.map((s) => s.label),
    recommendation: result.recommendation,
  };
}
