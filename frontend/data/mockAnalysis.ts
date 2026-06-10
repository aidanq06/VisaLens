import type { VisaLensAnalysis } from "@/types/analysis";

export const mockAnalysis: VisaLensAnalysis = {
  extracted: {
    opportunity_type: "paid internship",
    paid_status: "paid",
    work_authorization_language:
      "Applicants must be eligible to work in the United States.",
    citizenship_requirement: null,
    international_eligibility: "unclear",
    location_requirement: "United States",
    deadline_or_start_date: "2026-06-13",
    funding_restriction: null,
    student_level_requirement: "Undergraduate",
    required_materials: ["resume", "cover letter"],
    ambiguous_phrases: [
      "must be eligible to work in the United States",
      "enrolled at U.S. universities",
    ],
    evidence: [
      {
        field: "paid_status",
        value: "paid",
        source_text: "Paid summer AI internship for undergraduate students.",
        confidence: 0.97,
      },
      {
        field: "work_authorization_language",
        value: "eligible to work in the United States",
        source_text:
          "Applicants must be eligible to work in the United States.",
        confidence: 0.97,
      },
      {
        field: "location_requirement",
        value: "United States",
        source_text:
          "Applicants must be eligible to work in the United States.",
        confidence: 0.9,
      },
      {
        field: "student_level_requirement",
        value: "Undergraduate",
        source_text:
          "Paid summer AI internship for undergraduate students enrolled at U.S. universities.",
        confidence: 0.88,
      },
    ],
  },

  risk: {
    score: 78,
    level: "medium_high",
    main_label: "Unclear — verify before applying",
    summary:
      "This opportunity may be possible for F-1 students, but the paid role combined with explicit work authorization language makes eligibility uncertain. You should not assume you're eligible without written confirmation.",
    categories: {
      citizenship: {
        level: "moderate",
        score: 20,
        explanation: "No explicit citizenship requirement found.",
      },
      work_authorization: {
        level: "high",
        score: 45,
        explanation:
          '"Must be eligible to work in the U.S." directly implicates work authorization — critical for F-1 students.',
      },
      paid_role: {
        level: "medium_high",
        score: 25,
        explanation:
          "Paid roles require active work authorization (CPT or OPT) for F-1 students.",
      },
      location: {
        level: "moderate",
        score: 15,
        explanation:
          "U.S.-based opportunity. No remote/worldwide option mentioned.",
      },
      funding: {
        level: "low",
        score: 0,
        explanation: "No citizenship-restricted funding language detected.",
      },
      ambiguity: {
        level: "high",
        score: 20,
        explanation:
          "Two ambiguous phrases require direct clarification from the organizer.",
      },
      timeline: {
        level: "high",
        score: 20,
        explanation:
          "Deadline is in 3 days. Verification may not complete in time.",
      },
    },
    reasons: [
      "Paid role detected — work authorization may be required",
      'Work authorization language: "eligible to work in the United States"',
      "International eligibility not explicitly stated",
      "Deadline is close — verification timeline is tight",
    ],
  },

  graph: {
    nodes: [
      {
        id: "opportunity_uploaded",
        label: "Opportunity analyzed",
        status: "clear",
        owner: "system",
      },
      {
        id: "paid_role",
        label: "Paid role detected",
        status: "warning",
        owner: "organizer",
      },
      {
        id: "work_auth_language",
        label: "Work authorization language found",
        status: "blocked",
        owner: "student",
      },
      {
        id: "citizenship_check",
        label: "No explicit citizenship restriction",
        status: "clear",
        owner: "system",
      },
      {
        id: "intl_eligibility",
        label: "International eligibility unclear",
        status: "blocked",
        owner: "organizer",
      },
      {
        id: "organizer_verify",
        label: "Organizer verification needed",
        status: "pending",
        owner: "organizer",
      },
      {
        id: "advisor_verify",
        label: "DSO / advisor check recommended",
        status: "pending",
        owner: "advisor",
      },
    ],
    edges: [
      { from: "opportunity_uploaded", to: "paid_role" },
      { from: "opportunity_uploaded", to: "citizenship_check" },
      { from: "paid_role", to: "work_auth_language" },
      { from: "work_auth_language", to: "intl_eligibility" },
      { from: "citizenship_check", to: "intl_eligibility" },
      { from: "intl_eligibility", to: "organizer_verify" },
      { from: "intl_eligibility", to: "advisor_verify" },
    ],
  },

  timeline: {
    deadline_or_start_date: "2026-06-13",
    days_until_deadline: 3,
    estimated_verification_days: 5,
    risk_level: "high",
    critical_path: [
      "Contact organizer (allow 2 days for response)",
      "Consult DSO / advisor (allow 2 days)",
      "Make final decision (allow 1 day)",
    ],
    recommendation:
      "You have 3 days before the deadline but verification may take 4–5 days. Ask the organizer today — do not wait.",
  },

  verification: {
    organizer_questions: [
      "Do you accept F-1 international students for this role?",
      "Is U.S. citizenship or permanent residency required?",
      "Would this opportunity require CPT, OPT, or another work authorization?",
      "Is this position classified as employment, training, or a competition?",
      "Can students participate remotely?",
    ],
    advisor_questions: [
      "Would a paid internship with work authorization language require me to activate CPT?",
      "Does the phrase 'eligible to work in the U.S.' mean I need existing OPT or CPT?",
      "Should I get written confirmation from the employer before accepting?",
    ],
    email_draft:
      "Hello,\n\nI'm an international student (F-1 visa) currently enrolled at a U.S. university and I'm interested in applying to the Paid Summer AI Internship.\n\nCould you please clarify the following:\n\n1. Are F-1 international students eligible for this position?\n2. Would participation require work authorization such as CPT or OPT?\n3. Is U.S. citizenship or permanent residency required?\n\nThank you for your time. I look forward to hearing from you.\n\nBest regards",
    next_steps: [
      "Contact the opportunity organizer today using the email draft above.",
      "Schedule a meeting with your DSO or international student advisor.",
      "Do not assume eligibility until you receive written confirmation.",
      "Save any written clarification from the organizer for your records.",
      "If eligible, ask your advisor about CPT/OPT timeline and paperwork.",
    ],
    disclaimer:
      "VisaLens does not provide legal, immigration, or official eligibility advice. This report is for informational purposes only. Always verify with your school's international student office, a licensed immigration attorney, or official program organizers before making decisions about opportunity participation.",
  },
};

export const sampleOpportunities = [
  {
    id: "paid-ai-internship",
    title: "Paid Summer AI Internship",
    category: "internship",
    tags: ["paid", "work-auth-risk", "F-1-risky"],
    text: `Paid summer AI internship for undergraduate students enrolled at U.S. universities. Applicants must be eligible to work in the United States. Start date: June 13, 2026.

We are looking for motivated students interested in machine learning, data science, and AI research. Compensation is $25/hour. Applicants should submit a resume and cover letter.`,
  },
  {
    id: "nsf-reu",
    title: "NSF REU — Computational Biology",
    category: "research",
    tags: ["NSF", "citizenship-restricted", "paid"],
    text: `NSF Research Experiences for Undergraduates (REU) in Computational Biology. This program is funded by the National Science Foundation. Due to NSF funding requirements, participants must be U.S. citizens or permanent residents. The program provides a $6,000 stipend plus housing allowance. Application deadline: March 15, 2026.`,
  },
  {
    id: "global-hackathon",
    title: "Global AI for Good Hackathon",
    category: "hackathon",
    tags: ["global", "open-worldwide", "low-risk"],
    text: `Open to students worldwide. No U.S. work authorization required. International students welcome. This is an unpaid competition with prizes of up to $10,000 for winning teams. No employment relationship is created. Participants may be located anywhere globally. Remote participation is fully supported.`,
  },
];
