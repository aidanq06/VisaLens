export type RiskLevel = "low" | "moderate" | "medium_high" | "high";

export type EvidenceItem = {
  field: string;
  value: string;
  source_text: string;
  confidence: number;
};

export type RiskCategory = {
  level: RiskLevel;
  score: number;
  explanation: string;
};

export type GraphNodeStatus = "clear" | "warning" | "blocked" | "pending";

export type GraphNode = {
  id: string;
  label: string;
  status: GraphNodeStatus;
  owner: "student" | "organizer" | "advisor" | "system";
};

export type GraphEdge = {
  from: string;
  to: string;
  label?: string;
};

export type VisaLensAnalysis = {
  extracted: {
    opportunity_type: string;
    paid_status: "paid" | "unpaid" | "unknown";
    work_authorization_language: string | null;
    citizenship_requirement: string | null;
    international_eligibility:
      | "likely_eligible"
      | "likely_not_eligible"
      | "unclear"
      | "unknown";
    location_requirement: string | null;
    deadline_or_start_date: string | null;
    funding_restriction: string | null;
    student_level_requirement: string | null;
    required_materials: string[];
    ambiguous_phrases: string[];
    evidence: EvidenceItem[];
  };

  risk: {
    score: number;
    level: RiskLevel;
    main_label: string;
    summary: string;
    categories: {
      citizenship: RiskCategory;
      work_authorization: RiskCategory;
      paid_role: RiskCategory;
      location: RiskCategory;
      funding: RiskCategory;
      ambiguity: RiskCategory;
      timeline: RiskCategory;
    };
    reasons: string[];
  };

  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };

  timeline: {
    deadline_or_start_date: string | null;
    days_until_deadline: number | null;
    estimated_verification_days: number;
    risk_level: RiskLevel;
    critical_path: string[];
    recommendation: string;
  };

  verification: {
    organizer_questions: string[];
    advisor_questions: string[];
    email_draft: string;
    next_steps: string[];
    disclaimer: string;
  };
};

export type StudentContext = {
  status: "F-1" | "J-1" | "international_other" | "domestic" | "unsure";
  school_level: "high_school" | "college" | "graduate";
  opportunity_type:
    | "internship"
    | "research"
    | "scholarship"
    | "hackathon"
    | "fellowship"
    | "other";
};
