import type {
  ExtractedOpportunity,
  RiskAnalysis,
  RiskCategory,
  RiskLevel,
} from "@/types/analysis";
import { scoreToLevel } from "@/lib/riskColors";
import { simulateTimeline, DEFAULT_TIMELINE_INPUTS } from "@/lib/timelineSimulator";

/**
 * Deterministic risk scoring engine — the team's agreed rule set:
 *
 *   U.S. citizens only            +90
 *   Permanent residents only      +85
 *   Eligible to work in the U.S.  +45
 *   Paid role                     +25
 *   Paid + work auth language     +20 (additional)
 *   Open worldwide                -35
 *   Unclear eligibility           +20
 *   Funding citizenship-restricted+50
 *
 * The AI extracts fields; this module computes risk with transparent,
 * explainable rules. No LLM involved — judges can audit every point.
 *
 * NOTE: this is the client-side engine. If a dedicated backend risk
 * service lands later (Aidan's), it should produce the same shape and
 * this becomes the offline fallback.
 */

export type StudentStatus =
  | "f1"
  | "j1"
  | "international_other"
  | "domestic"
  | "unsure";

const LEVEL_SCORE: Record<RiskLevel, number> = {
  low: 10,
  moderate: 40,
  medium_high: 70,
  high: 90,
};

function cat(score: number, explanation: string): RiskCategory {
  const clamped = Math.max(0, Math.min(100, score));
  return { level: scoreToLevel(clamped), score: clamped, explanation };
}

export function calculateRisk(
  extracted: ExtractedOpportunity,
  studentStatus: StudentStatus = "f1",
  today: Date = new Date()
): RiskAnalysis {
  const reasons: string[] = [];
  let score = 0;

  const citizensOnly = extracted.citizenship_requirement === "U.S. citizens only";
  const prOnly = extracted.citizenship_requirement === "Permanent residents only";
  const citizensOrPR =
    extracted.citizenship_requirement === "U.S. citizens or permanent residents";
  const hasWorkAuth = !!extracted.work_authorization_language;
  const isPaid = extracted.paid_status === "paid";
  const worldwide = extracted.remote_or_global_status === "open worldwide";
  const fundingRestricted = !!extracted.funding_restriction;
  const unclear =
    extracted.international_eligibility === "unclear" ||
    extracted.international_eligibility === "unknown";

  // --- Apply the agreed rules ---
  if (citizensOnly) {
    score += 90;
    reasons.push("Listing restricts participation to U.S. citizens only");
  } else if (prOnly) {
    score += 85;
    reasons.push("Listing restricts participation to permanent residents only");
  } else if (citizensOrPR) {
    score += 85;
    reasons.push("Listing restricts participation to U.S. citizens or permanent residents");
  }
  if (hasWorkAuth) {
    score += 45;
    reasons.push("Work authorization language detected");
  }
  if (isPaid) {
    score += 25;
    reasons.push("Paid role detected");
  }
  if (isPaid && hasWorkAuth) {
    score += 20;
    reasons.push("Paid role combined with work authorization language increases risk");
  }
  if (worldwide) {
    score -= 35;
    reasons.push("Opportunity appears open worldwide, which lowers risk");
  }
  if (unclear && !citizensOnly && !prOnly && !citizensOrPR) {
    score += 20;
    reasons.push("International eligibility is not clearly stated");
  }
  if (fundingRestricted) {
    score += 50;
    reasons.push("Funding appears restricted by citizenship or residency");
  }

  // --- Student context adjustment ---
  if (studentStatus === "domestic") {
    score = Math.round(score * 0.2);
    reasons.push(
      "You indicated domestic status, so visa-related risks largely do not apply — verify other requirements normally"
    );
  } else if (studentStatus === "unsure") {
    reasons.push("Status marked as unsure — treat visa-related risks cautiously");
  }

  score = Math.max(0, Math.min(100, score));

  // --- Category breakdown ---
  const intl = studentStatus !== "domestic";

  const citizenship = citizensOnly
    ? cat(90, "The listing explicitly requires U.S. citizenship.")
    : prOnly || citizensOrPR
      ? cat(85, "The listing restricts eligibility to citizens or permanent residents.")
      : cat(
          unclear ? 35 : 10,
          unclear
            ? "No explicit citizenship restriction was found, but eligibility is not fully clear."
            : "No citizenship restriction detected."
        );

  const workAuthorization = hasWorkAuth
    ? cat(
        90,
        `The listing includes work-eligibility language: "${extracted.work_authorization_language}".`
      )
    : cat(
        isPaid && intl ? 40 : 10,
        isPaid && intl
          ? "No explicit work-authorization language, but paid roles may still require it."
          : "No work-authorization language detected."
      );

  const paidRole = isPaid
    ? cat(
        intl ? 75 : 25,
        intl
          ? "Paid roles may require work authorization for international students."
          : "Paid role detected."
      )
    : extracted.paid_status === "unpaid"
      ? cat(10, "The opportunity appears to be unpaid or volunteer-based.")
      : cat(30, "Payment status could not be determined from the listing.");

  const location = worldwide
    ? cat(5, "The opportunity appears open worldwide.")
    : extracted.location_requirement
      ? cat(45, "The opportunity appears to be U.S.-based or requires U.S. presence.")
      : cat(20, "No explicit location requirement detected.");

  const funding = fundingRestricted
    ? cat(85, `Funding language detected: "${extracted.funding_restriction}".`)
    : cat(10, "No explicit funding restriction was found.");

  const ambiguity =
    unclear && intl
      ? cat(85, "The listing does not clearly state whether international students are eligible.")
      : cat(15, "Eligibility language is relatively clear.");

  // Timeline category from the simulator (single source of truth).
  const timelineResult = simulateTimeline(
    extracted.deadline_or_start_date,
    DEFAULT_TIMELINE_INPUTS,
    today
  );
  const timeline = cat(
    LEVEL_SCORE[timelineResult.riskLevel],
    timelineResult.daysUntilDeadline === null
      ? "No deadline detected."
      : `About ${timelineResult.daysUntilDeadline} days remain; verification needs roughly ${timelineResult.daysNeeded}.`
  );

  if (timelineResult.riskLevel === "high" || timelineResult.riskLevel === "medium_high") {
    reasons.push("Deadline or start date is close — verification time is tight");
  }

  return {
    score,
    level: scoreToLevel(score),
    categories: {
      citizenship,
      work_authorization: workAuthorization,
      paid_role: paidRole,
      location,
      funding,
      ambiguity,
      timeline,
    },
    reasons,
  };
}
