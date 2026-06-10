import type { NodeStatus, RiskLevel } from "@/types/analysis";

/** Shared color/label helpers so every card renders risk consistently. */

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  moderate: "Moderate risk",
  medium_high: "Medium-high risk",
  high: "High risk",
};

/** Tailwind classes for risk badges (bg + text + border). */
export const RISK_LEVEL_BADGE: Record<RiskLevel, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  medium_high: "bg-orange-50 text-orange-700 border-orange-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

/** Solid accent color per risk level (progress bars, highlights). */
export const RISK_LEVEL_ACCENT: Record<RiskLevel, string> = {
  low: "bg-emerald-500",
  moderate: "bg-amber-500",
  medium_high: "bg-orange-500",
  high: "bg-red-500",
};

export const NODE_STATUS_LABEL: Record<NodeStatus, string> = {
  clear: "Clear",
  warning: "Verify",
  blocked: "Blocking risk",
  pending: "Pending",
};

/** Styles for React Flow blocker nodes. */
export const NODE_STATUS_STYLE: Record<
  NodeStatus,
  { container: string; dot: string }
> = {
  clear: {
    container: "border-emerald-300 bg-emerald-50 text-emerald-900",
    dot: "bg-emerald-500",
  },
  warning: {
    container: "border-amber-300 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
  blocked: {
    container: "border-red-300 bg-red-50 text-red-900",
    dot: "bg-red-500",
  },
  pending: {
    container: "border-slate-300 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
  },
};

export const OWNER_LABEL: Record<string, string> = {
  student: "You",
  organizer: "Organizer",
  advisor: "Advisor/DSO",
  system: "VisaLens",
};

export const OWNER_BADGE: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  organizer: "bg-purple-100 text-purple-700",
  advisor: "bg-teal-100 text-teal-700",
  system: "bg-slate-200 text-slate-600",
};

/** Map a 0-100 score to a risk level (same thresholds as the risk engine). */
export function scoreToLevel(score: number): RiskLevel {
  if (score >= 75) return "high";
  if (score >= 50) return "medium_high";
  if (score >= 25) return "moderate";
  return "low";
}
