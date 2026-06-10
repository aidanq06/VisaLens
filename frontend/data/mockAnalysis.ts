import type { VisaLensAnalysis } from "@/types/analysis";

/**
 * Canonical mock used by all four engines while the backend is wired up.
 * Scenario: paid summer AI internship, U.S.-based, work-auth language,
 * unclear F-1 eligibility, start date close to today.
 */
export const mockAnalysis: VisaLensAnalysis = {
  extracted: {
    opportunity_type: "internship",
    paid_status: "paid",
    work_authorization_language: "eligible to work in the United States",
    citizenship_requirement: "not_explicit",
    international_eligibility: "unclear",
    location_requirement: "United States",
    deadline_or_start_date: "2026-06-13",
    funding_restriction: null,
    student_level_requirement: "undergraduate",
    remote_or_global_status: null,
    required_materials: ["resume"],
    ambiguous_phrases: ["must be eligible to work in the United States"],
    evidence: [
      {
        field: "paid_status",
        value: "paid",
        source_text: "Paid summer AI internship",
        confidence: 0.95,
      },
      {
        field: "work_authorization_language",
        value: "eligible to work in the United States",
        source_text: "Applicants must be eligible to work in the United States",
        confidence: 0.97,
      },
    ],
  },
  risk: {
    score: 78,
    level: "medium_high",
    categories: {
      citizenship: {
        level: "moderate",
        score: 35,
        explanation:
          "No explicit citizenship restriction was found, but eligibility is not fully clear.",
      },
      work_authorization: {
        level: "high",
        score: 90,
        explanation:
          "The listing says applicants must be eligible to work in the United States.",
      },
      paid_role: {
        level: "medium_high",
        score: 75,
        explanation:
          "Paid roles may require work authorization for international students.",
      },
      location: {
        level: "moderate",
        score: 45,
        explanation: "The opportunity appears to be U.S.-based.",
      },
      funding: {
        level: "low",
        score: 10,
        explanation: "No explicit funding restriction was found.",
      },
      ambiguity: {
        level: "high",
        score: 85,
        explanation:
          "The listing does not clearly state whether F-1 students are eligible.",
      },
      timeline: {
        level: "medium_high",
        score: 70,
        explanation:
          "The start date is close enough that verification should happen immediately.",
      },
    },
    reasons: [
      "Paid role detected",
      "Work authorization language detected",
      "International eligibility is unclear",
      "Start date/deadline may be close",
    ],
  },
  graph: {
    nodes: [
      {
        id: "opportunity_uploaded",
        label: "Opportunity uploaded",
        status: "clear",
        owner: "student",
      },
      {
        id: "paid_role",
        label: "Paid role detected",
        status: "warning",
        owner: "organizer",
      },
      {
        id: "work_auth",
        label: "Work authorization may be required",
        status: "blocked",
        owner: "student",
      },
      {
        id: "eligibility_unclear",
        label: "International eligibility unclear",
        status: "blocked",
        owner: "system",
      },
      {
        id: "organizer_verify",
        label: "Organizer verification needed",
        status: "pending",
        owner: "organizer",
      },
      {
        id: "advisor_verify",
        label: "Advisor/DSO verification recommended",
        status: "pending",
        owner: "advisor",
      },
    ],
    edges: [
      { from: "opportunity_uploaded", to: "paid_role" },
      { from: "paid_role", to: "work_auth" },
      { from: "work_auth", to: "eligibility_unclear" },
      { from: "eligibility_unclear", to: "organizer_verify" },
      { from: "eligibility_unclear", to: "advisor_verify" },
    ],
  },
  timeline: {
    deadline_or_start_date: "2026-06-13",
    days_until_deadline: 5,
    estimated_verification_days: 5,
    risk_level: "medium_high",
    critical_path: [
      "Organizer response",
      "Advisor/DSO clarification",
      "Student decision",
    ],
    recommendation:
      "Ask the organizer today because verification may take almost the entire remaining time.",
  },
  verification: {
    organizer_questions: [
      "Do you accept F-1 international students?",
      "Is this opportunity paid?",
      "Would this role require CPT, OPT, or another form of work authorization?",
      "Is U.S. citizenship or permanent residency required?",
    ],
    advisor_questions: [
      "Would this opportunity require work authorization?",
      "Should I verify CPT or OPT eligibility before applying?",
      "Is this safe to pursue before receiving clarification from the organizer?",
    ],
    email_draft:
      "Hello, I'm an international student currently enrolled at a U.S. university and I'm interested in applying to this opportunity. Could you clarify whether F-1 students are eligible and whether this role would require work authorization such as CPT or OPT? Thank you.",
    next_steps: [
      "Contact the opportunity organizer.",
      "Ask your school's international student office or advisor.",
      "Do not assume eligibility until you receive confirmation.",
      "Save written clarification from the organizer.",
    ],
    disclaimer:
      "VisaLens does not provide legal, immigration, financial, or official eligibility advice. Verify with official sources, advisors, or opportunity organizers.",
  },
};
