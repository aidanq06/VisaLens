import type {
  PartialVisaLensAnalysis,
  RiskCategoryKey,
  RiskLevel,
} from "@/types/analysis";

/**
 * Verification kit generator.
 *
 * Takes whatever analysis data exists (full backend response, partial
 * response, or just risk categories) and produces a complete, safe set
 * of verification actions. Backend-provided verification content wins;
 * anything missing is derived from the risk categories so the UI never
 * renders empty.
 *
 * Language rules: cautious phrasing only ("may require", "appears to",
 * "verify with"). Never asserts eligibility or legal status.
 */

export type VerificationKitResult = {
  organizerQuestions: string[];
  advisorQuestions: string[];
  /** Organizer email body (matches the shared schema's email_draft). */
  emailDraft: string;
  advisorEmailDraft: string;
  organizerSubject: string;
  advisorSubject: string;
  nextSteps: string[];
  disclaimer: string;
  urgencyLabel: RiskLevel;
};

const DEFAULT_DISCLAIMER =
  "VisaLens does not provide legal, immigration, financial, or official eligibility advice. This analysis only highlights what may need verification. Confirm with official sources, your school's international student office, or the opportunity organizer before applying or accepting.";

const AT_LEAST_MODERATE: RiskLevel[] = ["moderate", "medium_high", "high"];

function catLevel(
  analysis: PartialVisaLensAnalysis,
  key: RiskCategoryKey
): RiskLevel | null {
  return analysis.risk?.categories?.[key]?.level ?? null;
}

function isAtLeastModerate(level: RiskLevel | null): boolean {
  return !!level && AT_LEAST_MODERATE.includes(level);
}

/** Organizer questions derived from detected risk signals. */
export function generateOrganizerQuestions(
  analysis: PartialVisaLensAnalysis
): string[] {
  const questions: string[] = [
    // Always lead with the core eligibility question.
    "Do you accept F-1 or other international students?",
  ];

  if (
    isAtLeastModerate(catLevel(analysis, "paid_role")) ||
    analysis.extracted?.paid_status === "paid"
  ) {
    questions.push(
      "Is this opportunity paid, and if so, would participation require work authorization?"
    );
  }
  if (isAtLeastModerate(catLevel(analysis, "work_authorization"))) {
    questions.push(
      "Would this role require CPT, OPT, or another form of U.S. work authorization?"
    );
  }
  if (isAtLeastModerate(catLevel(analysis, "citizenship"))) {
    questions.push(
      "Is U.S. citizenship or permanent residency required to participate?"
    );
  }
  if (isAtLeastModerate(catLevel(analysis, "funding"))) {
    questions.push(
      "Are there funding or stipend restrictions based on citizenship or residency status?"
    );
  }
  if (catLevel(analysis, "ambiguity") === "high") {
    questions.push(
      "Could you confirm in writing whether international students are explicitly eligible?"
    );
  }
  if (isAtLeastModerate(catLevel(analysis, "location"))) {
    questions.push(
      "Is participation remote, in person, or hybrid — and are there location or residency constraints?"
    );
  }

  return questions;
}

/** Advisor/DSO questions derived from detected risk signals. */
export function generateAdvisorQuestions(
  analysis: PartialVisaLensAnalysis
): string[] {
  const questions: string[] = [];

  if (isAtLeastModerate(catLevel(analysis, "work_authorization"))) {
    questions.push(
      "This opportunity mentions U.S. work eligibility — would it require work authorization for my visa status?"
    );
  }
  if (
    isAtLeastModerate(catLevel(analysis, "paid_role")) ||
    analysis.extracted?.paid_status === "paid"
  ) {
    questions.push(
      "The role appears to be paid — might I need CPT, OPT, or another approval before accepting?"
    );
  }
  if (isAtLeastModerate(catLevel(analysis, "timeline"))) {
    questions.push(
      "How long does eligibility or authorization verification usually take, given the deadline is close?"
    );
  }

  // Always end with the safe baseline question.
  questions.push(
    "Is there anything else I should verify before applying or accepting this opportunity?"
  );
  return questions;
}

/** Next steps tuned to overall risk level. */
export function generateNextSteps(analysis: PartialVisaLensAnalysis): string[] {
  const level = analysis.risk?.level ?? "moderate";
  const steps: string[] = ["Email the opportunity organizer with the questions above."];

  if (level === "high" || level === "medium_high") {
    steps.push(
      "Contact your school's international student office or DSO before applying or accepting anything.",
      "Do not assume eligibility until you receive written confirmation.",
      "Save all written clarifications from the organizer and your advisor."
    );
  } else {
    steps.push(
      "Mention the opportunity to your advisor or international student office in case anything needs verification.",
      "Keep written confirmation of eligibility with your application materials."
    );
  }

  if (isAtLeastModerate(catLevel(analysis, "timeline"))) {
    steps.push(
      "Start verification today — the deadline leaves limited time for responses."
    );
  }
  return steps;
}

// ---------------------------------------------------------------------------
// Email drafts
// ---------------------------------------------------------------------------

export function buildOrganizerEmail(analysis: PartialVisaLensAnalysis): string {
  const type = analysis.extracted?.opportunity_type ?? "opportunity";
  const paid =
    analysis.extracted?.paid_status === "paid" ||
    isAtLeastModerate(catLevel(analysis, "paid_role"));
  const workAuth = isAtLeastModerate(catLevel(analysis, "work_authorization"));

  const lines = [
    "Hello,",
    "",
    `I'm an international student currently enrolled at a U.S. university, and I'm very interested in applying to this ${type}. Could you clarify whether F-1 international students are eligible?`,
  ];
  if (paid || workAuth) {
    lines.push(
      "",
      "I also wanted to ask whether the role is paid and whether participation may require work authorization such as CPT or OPT, so I can coordinate with my school's international student office if needed."
    );
  }
  lines.push("", "Thank you for your time.", "", "Best regards,");
  return lines.join("\n");
}

export function buildAdvisorEmail(analysis: PartialVisaLensAnalysis): string {
  const type = analysis.extracted?.opportunity_type ?? "STEM opportunity";
  const deadline = analysis.extracted?.deadline_or_start_date;

  const lines = [
    "Hello,",
    "",
    `I found a ${type} that I'd like to apply for, but the listing includes language about U.S. work eligibility and the role may be paid. Before I apply or accept anything, could you help me understand whether this may require CPT, OPT, or another approval process for my visa status?`,
  ];
  if (deadline) {
    lines.push(
      "",
      `The deadline or start date appears to be ${deadline}, so I'd appreciate any guidance on how quickly verification can happen.`
    );
  }
  lines.push("", "Thank you.", "", "Best regards,");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateVerificationKit(
  analysis: PartialVisaLensAnalysis
): VerificationKitResult {
  const v = analysis.verification;

  // Backend content wins; generate anything missing.
  const organizerQuestions =
    v?.organizer_questions && v.organizer_questions.length > 0
      ? v.organizer_questions
      : generateOrganizerQuestions(analysis);

  const advisorQuestions =
    v?.advisor_questions && v.advisor_questions.length > 0
      ? v.advisor_questions
      : generateAdvisorQuestions(analysis);

  const emailDraft =
    v?.email_draft && v.email_draft.trim().length > 0
      ? v.email_draft
      : buildOrganizerEmail(analysis);

  const nextSteps =
    v?.next_steps && v.next_steps.length > 0
      ? v.next_steps
      : generateNextSteps(analysis);

  const urgencyLabel: RiskLevel =
    analysis.timeline?.risk_level ?? analysis.risk?.level ?? "moderate";

  return {
    organizerQuestions,
    advisorQuestions,
    emailDraft,
    advisorEmailDraft: buildAdvisorEmail(analysis),
    organizerSubject: "Clarification on international student eligibility",
    advisorSubject: "Question about opportunity eligibility and work authorization",
    nextSteps,
    disclaimer: v?.disclaimer ?? DEFAULT_DISCLAIMER,
    urgencyLabel,
  };
}
