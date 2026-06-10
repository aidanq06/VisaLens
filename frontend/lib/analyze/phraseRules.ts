import type { EvidenceItem, ExtractedOpportunity } from "@/types/analysis";

/**
 * Deterministic, client-side extraction engine.
 *
 * Mirrors the rule layer of backend/services/extraction/phrase_rules.py so
 * the demo works end-to-end with zero network calls. When the backend LLM
 * extraction is wired in, this becomes the offline fallback — both produce
 * the same ExtractedOpportunity shape.
 *
 * Every detection records sentence-level evidence with a confidence score.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the full sentence containing a match index (for evidence display). */
function sentenceAt(text: string, index: number): string {
  const boundary = /[.!?\n]/;
  let start = index;
  while (start > 0 && !boundary.test(text[start - 1])) start--;
  let end = index;
  while (end < text.length && !boundary.test(text[end])) end++;
  return text.slice(start, Math.min(end + 1, text.length)).trim();
}

type Detection = { match: string; source: string; index: number };

function detect(text: string, pattern: RegExp): Detection | null {
  const m = pattern.exec(text);
  if (!m) return null;
  return { match: m[0], source: sentenceAt(text, m.index), index: m.index };
}

// ---------------------------------------------------------------------------
// Patterns (ordered roughly by severity within each field)
// ---------------------------------------------------------------------------

const P = {
  citizensOnly:
    /\b(?:U\.?S\.?|United States)\s+citizens?(?:\s+(?:or|and)\s+(?:U\.?S\.?\s+)?(?:lawful\s+)?permanent\s+residents?)?\s+only\b|\bmust\s+be\s+(?:a\s+)?(?:U\.?S\.?|United States)\s+citizen\b|\bopen\s+only\s+to\s+(?:U\.?S\.?|United States)\s+citizens?\b|\b(?:U\.?S\.?\s+)?citizenship\s+(?:is\s+)?required\b/i,
  permanentResidentsOnly:
    /\b(?:lawful\s+)?permanent\s+residents?\s+only\b|\bmust\s+be\s+a\s+(?:lawful\s+)?permanent\s+resident\b|\bgreen\s*card\s+(?:holders?\s+only|required)\b/i,
  citizensOrPR:
    /\b(?:U\.?S\.?|United States)\s+citizens?\s+(?:or|and)\s+(?:lawful\s+)?permanent\s+residents?\b/i,
  workAuth:
    /\b(?:must\s+be\s+|applicants?\s+must\s+be\s+)?(?:eligible|authorized)\s+to\s+work\s+in\s+the\s+(?:U\.?S\.?|United States)\b|\bwork\s+authorization\s+(?:is\s+)?required\b|\bproof\s+of\s+work\s+authorization\b|\bemployment\s+eligibility\s+verification\b|\bE-?Verify\b/i,
  cptOpt: /\bCPT\b|\bOPT\b|\bcurricular\s+practical\s+training\b|\boptional\s+practical\s+training\b/i,
  ssn: /\bSSN\b|\bsocial\s+security\s+number\b/i,
  paid: /\bpaid\b|\bstipend\b|\bsalary\b|\bcompensat(?:ion|ed)\b|\bhourly\s+(?:rate|wage)\b|\$\s?\d[\d,]*/i,
  unpaid: /\bunpaid\b|\bvolunteer\b|\bno\s+compensation\b|\bnot\s+(?:a\s+)?paid\b/i,
  worldwide:
    /\bopen\s+(?:to\s+(?:students\s+)?worldwide|worldwide|globally|to\s+all\s+countries|to\s+everyone)\b|\bany\s+country\b|\binternational\s+(?:students\s+|applicants\s+)?(?:are\s+)?welcome\b|\bno\s+citizenship\s+requirement/i,
  usLocation:
    /\bmust\s+be\s+(?:located|based)\s+in\s+the\s+(?:U\.?S\.?|United States)\b|\bon-?site\b|\bin\s+person\b|\b(?:U\.?S\.?|United States)[- ]based\b|\benrolled\s+at\s+(?:a\s+)?(?:U\.?S\.?|United States)\s+(?:universit(?:y|ies)|institution|college)/i,
  remote: /\bremote\b|\bvirtual\b|\bonline\b/i,
  fundingRestricted:
    /\b(?:funding|stipend|award|fellowship|grant)\s+(?:is\s+)?(?:restricted\s+to|limited\s+to|available\s+only\s+to|only\s+for)\b[^.\n]*\b(?:citizens?|permanent\s+residents?)\b|\bNSF[- ]funded\b|\bfederal(?:ly)?\s+fund(?:ed|ing)\b/i,
  deadline:
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b/i,
  undergrad: /\bundergraduate\b|\bundergrads?\b|\bbachelor'?s?\b/i,
  graduate: /\bgraduate\s+students?\b|\bmaster'?s?\b|\bPhD\b|\bdoctoral\b/i,
  highSchool: /\bhigh\s+school\b/i,
  // Opportunity types
  internship: /\binternship\b|\bintern\b|\bco-?op\b/i,
  research: /\bresearch\b|\bREU\b|\blab\b/i,
  scholarship: /\bscholarship\b/i,
  fellowship: /\bfellowship\b/i,
  hackathon: /\bhackathon\b/i,
  competition: /\bcompetition\b|\bchallenge\b/i,
};

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

export function extractOpportunity(
  text: string,
  declaredType?: string
): ExtractedOpportunity {
  const evidence: EvidenceItem[] = [];
  const ambiguousPhrases: string[] = [];

  function record(field: string, value: string, d: Detection, confidence: number) {
    evidence.push({ field, value, source_text: d.source, confidence });
  }

  // --- Opportunity type ---
  let opportunityType = declaredType && declaredType !== "other" ? declaredType : "";
  if (!opportunityType) {
    const typeChecks: [string, RegExp][] = [
      ["internship", P.internship],
      ["scholarship", P.scholarship],
      ["fellowship", P.fellowship],
      ["hackathon", P.hackathon],
      ["research program", P.research],
      ["competition", P.competition],
    ];
    for (const [label, pattern] of typeChecks) {
      if (pattern.test(text)) {
        opportunityType = label;
        break;
      }
    }
    if (!opportunityType) opportunityType = "opportunity";
  }

  // --- Paid status ---
  let paidStatus: ExtractedOpportunity["paid_status"] = "unknown";
  const unpaidHit = detect(text, P.unpaid);
  const paidHit = detect(text, P.paid);
  if (unpaidHit) {
    paidStatus = "unpaid";
    record("paid_status", "unpaid", unpaidHit, 0.9);
  } else if (paidHit) {
    paidStatus = "paid";
    record("paid_status", "paid", paidHit, 0.92);
  }

  // --- Citizenship requirement ---
  let citizenship: string | null = null;
  const citizensOnlyHit = detect(text, P.citizensOnly);
  const prOnlyHit = detect(text, P.permanentResidentsOnly);
  const citizensOrPRHit = detect(text, P.citizensOrPR);
  if (citizensOnlyHit) {
    citizenship = "U.S. citizens only";
    record("citizenship_requirement", citizenship, citizensOnlyHit, 0.95);
  } else if (prOnlyHit) {
    citizenship = "Permanent residents only";
    record("citizenship_requirement", citizenship, prOnlyHit, 0.93);
  } else if (citizensOrPRHit) {
    citizenship = "U.S. citizens or permanent residents";
    record("citizenship_requirement", citizenship, citizensOrPRHit, 0.92);
  } else {
    citizenship = "not_explicit";
  }

  // --- Work authorization language ---
  let workAuthLanguage: string | null = null;
  const workAuthHit = detect(text, P.workAuth);
  const cptOptHit = detect(text, P.cptOpt);
  const ssnHit = detect(text, P.ssn);
  if (workAuthHit) {
    workAuthLanguage = workAuthHit.match;
    record("work_authorization_language", workAuthHit.match, workAuthHit, 0.95);
    ambiguousPhrases.push(workAuthHit.match);
  } else if (cptOptHit) {
    workAuthLanguage = cptOptHit.match;
    record("work_authorization_language", cptOptHit.match, cptOptHit, 0.85);
  }
  if (ssnHit) {
    if (!workAuthLanguage) workAuthLanguage = "SSN required";
    record("work_authorization_language", "SSN required", ssnHit, 0.88);
  }

  // --- Location / remote ---
  let location: string | null = null;
  let remoteStatus: string | null = null;
  const worldwideHit = detect(text, P.worldwide);
  const usLocationHit = detect(text, P.usLocation);
  const remoteHit = detect(text, P.remote);
  if (worldwideHit) {
    remoteStatus = "open worldwide";
    record("remote_or_global_status", "open worldwide", worldwideHit, 0.9);
  }
  if (usLocationHit) {
    location = "United States";
    record("location_requirement", "United States", usLocationHit, 0.88);
  }
  if (remoteHit && !worldwideHit) {
    remoteStatus = location ? "remote (U.S. only)" : "remote";
    record("remote_or_global_status", remoteStatus, remoteHit, 0.75);
  }

  // --- Funding restriction ---
  let fundingRestriction: string | null = null;
  const fundingHit = detect(text, P.fundingRestricted);
  if (fundingHit) {
    fundingRestriction = fundingHit.match;
    record("funding_restriction", fundingHit.match, fundingHit, 0.85);
  }

  // --- Deadline / start date ---
  let deadline: string | null = null;
  const deadlineHit = detect(text, P.deadline);
  if (deadlineHit) {
    deadline = deadlineHit.match;
    record("deadline_or_start_date", deadlineHit.match, deadlineHit, 0.9);
  }

  // --- Student level ---
  let studentLevel: string | null = null;
  if (P.highSchool.test(text)) studentLevel = "high school";
  else if (P.graduate.test(text)) studentLevel = "graduate";
  else if (P.undergrad.test(text)) studentLevel = "undergraduate";

  // --- International eligibility inference ---
  let intlEligibility: ExtractedOpportunity["international_eligibility"];
  if (citizensOnlyHit || prOnlyHit || citizensOrPRHit) {
    intlEligibility = "likely_not_eligible";
  } else if (worldwideHit) {
    intlEligibility = "likely_eligible";
  } else if (workAuthLanguage || paidStatus === "paid" || location) {
    intlEligibility = "unclear";
    if (workAuthLanguage && !ambiguousPhrases.includes(workAuthLanguage)) {
      ambiguousPhrases.push(workAuthLanguage);
    }
  } else {
    intlEligibility = "unknown";
  }

  return {
    opportunity_type: opportunityType,
    paid_status: paidStatus,
    work_authorization_language: workAuthLanguage,
    citizenship_requirement: citizenship,
    international_eligibility: intlEligibility,
    location_requirement: location,
    deadline_or_start_date: deadline,
    funding_restriction: fundingRestriction,
    student_level_requirement: studentLevel,
    remote_or_global_status: remoteStatus,
    required_materials: [],
    ambiguous_phrases: ambiguousPhrases,
    evidence,
  };
}
