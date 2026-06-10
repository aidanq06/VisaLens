/**
 * VisaLens shared analysis schema.
 *
 * This is the team contract. Every engine (extraction, risk, workflow,
 * verification) reads/writes this shape. Field names match the backend
 * Pydantic models in backend/services/extraction/schemas.py.
 *
 * Do not change this file without team agreement.
 */

export type RiskLevel = "low" | "moderate" | "medium_high" | "high";

export type EvidenceItem = {
  field: string;
  value: string;
  source_text: string;
  confidence: number; // 0..1
};

export type RiskCategory = {
  level: RiskLevel;
  score: number; // 0..100
  explanation: string;
};

export type RiskCategoryKey =
  | "citizenship"
  | "work_authorization"
  | "paid_role"
  | "location"
  | "funding"
  | "ambiguity"
  | "timeline";

export type NodeStatus = "clear" | "warning" | "blocked" | "pending";
export type NodeOwner = "student" | "organizer" | "advisor" | "system";

export type GraphNode = {
  id: string;
  label: string;
  status: NodeStatus;
  owner: NodeOwner;
};

export type GraphEdge = {
  from: string;
  to: string;
  label?: string;
};

export type ExtractedOpportunity = {
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
  // Extra fields produced by the extraction engine (Pranav).
  // Optional so older mock data still type-checks.
  funding_restriction?: string | null;
  student_level_requirement?: string | null;
  remote_or_global_status?: string | null;
  required_materials?: string[];
  ambiguous_phrases?: string[];
  evidence: EvidenceItem[];
};

export type RiskAnalysis = {
  score: number; // 0..100
  level: RiskLevel;
  categories: Record<RiskCategoryKey, RiskCategory>;
  reasons: string[];
};

export type TimelineAnalysis = {
  deadline_or_start_date: string | null;
  days_until_deadline: number | null;
  estimated_verification_days: number;
  risk_level: RiskLevel;
  critical_path: string[];
  recommendation: string;
};

export type VerificationKit = {
  organizer_questions: string[];
  advisor_questions: string[];
  email_draft: string;
  next_steps: string[];
  disclaimer: string;
};

export type VisaLensAnalysis = {
  extracted: ExtractedOpportunity;
  risk: RiskAnalysis;
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  timeline: TimelineAnalysis;
  verification: VerificationKit;
};

/**
 * Partial analysis: what the dashboard may actually receive while the
 * backend pipeline is incomplete. Every section is optional; the
 * workflow layer has fallbacks for all of them.
 */
export type PartialVisaLensAnalysis = {
  extracted?: Partial<ExtractedOpportunity> | null;
  risk?: Partial<RiskAnalysis> | null;
  graph?: { nodes?: GraphNode[]; edges?: GraphEdge[] } | null;
  timeline?: Partial<TimelineAnalysis> | null;
  verification?: Partial<VerificationKit> | null;
};
