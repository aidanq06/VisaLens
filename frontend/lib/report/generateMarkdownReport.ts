import type { PartialVisaLensAnalysis } from "@/types/analysis";
import { RISK_LEVEL_LABEL } from "@/lib/riskColors";
import { generateVerificationKit } from "@/lib/verification/generateVerificationKit";

/**
 * Render the full analysis as a clean Markdown report — Devpost/demo
 * friendly, copy-pasteable, and downloadable as .md (no PDF deps).
 * Handles partial data: missing sections are skipped or marked pending.
 */
export function generateMarkdownReport(
  analysis: PartialVisaLensAnalysis,
  now: Date = new Date()
): string {
  const kit = generateVerificationKit(analysis);
  const e = analysis.extracted;
  const risk = analysis.risk;
  const timeline = analysis.timeline;

  const lines: string[] = [];
  const section = (title: string) => {
    lines.push("", `## ${title}`, "");
  };

  // Header
  lines.push(
    "# VisaLens AI — Opportunity Readiness Report",
    "",
    `*Generated ${now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} by VisaLens AI*`
  );

  // Overall risk
  section("Overall risk");
  if (risk?.score !== undefined && risk?.score !== null) {
    lines.push(
      `**Score:** ${risk.score} / 100`,
      `**Level:** ${risk.level ? RISK_LEVEL_LABEL[risk.level] : "Pending"}`
    );
  } else {
    lines.push("_Risk analysis pending._");
  }
  if (risk?.reasons && risk.reasons.length > 0) {
    lines.push("", "**Main concerns:**", "");
    for (const r of risk.reasons) lines.push(`- ${r}`);
  }

  // Extracted fields
  section("Extracted opportunity details");
  if (e) {
    const rows: [string, string | null | undefined][] = [
      ["Opportunity type", e.opportunity_type],
      ["Paid status", e.paid_status],
      ["Work authorization language", e.work_authorization_language],
      ["Citizenship requirement", e.citizenship_requirement],
      ["International eligibility", e.international_eligibility],
      ["Location requirement", e.location_requirement],
      ["Deadline / start date", e.deadline_or_start_date],
    ];
    lines.push("| Field | Value |", "| --- | --- |");
    for (const [label, value] of rows) {
      lines.push(`| ${label} | ${value ?? "not found"} |`);
    }
  } else {
    lines.push("_Extraction pending._");
  }

  // Timeline
  section("Timeline");
  if (timeline) {
    if (timeline.days_until_deadline !== null && timeline.days_until_deadline !== undefined) {
      lines.push(`- **Days until deadline:** ${timeline.days_until_deadline}`);
    }
    if (timeline.estimated_verification_days !== undefined) {
      lines.push(
        `- **Estimated verification time:** ${timeline.estimated_verification_days} days`
      );
    }
    if (timeline.risk_level) {
      lines.push(`- **Timeline risk:** ${RISK_LEVEL_LABEL[timeline.risk_level]}`);
    }
    if (timeline.recommendation) {
      lines.push("", `> ${timeline.recommendation}`);
    }
  } else {
    lines.push("_No timeline information available._");
  }

  // Verification questions
  section("Questions for the organizer");
  for (const q of kit.organizerQuestions) lines.push(`- ${q}`);

  section("Questions for your advisor/DSO");
  for (const q of kit.advisorQuestions) lines.push(`- ${q}`);

  // Email draft
  section("Email draft (organizer)");
  lines.push(`**Subject:** ${kit.organizerSubject}`, "", kit.emailDraft);

  // Next steps
  section("Next steps");
  kit.nextSteps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));

  // Disclaimer
  section("Disclaimer");
  lines.push(`*${kit.disclaimer}*`);

  return lines.join("\n");
}
