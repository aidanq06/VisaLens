import type { RiskLevel } from "@/types/analysis";

export function riskColor(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: "#2ecc71",
    moderate: "#f0c040",
    medium_high: "#f5a623",
    high: "#ef4343",
  };
  return map[level] ?? "#7a7f99";
}

export function riskLabel(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: "Low Risk",
    moderate: "Moderate",
    medium_high: "Medium-High",
    high: "High Risk",
  };
  return map[level] ?? "Unknown";
}

export function confidenceLabel(c: number): string {
  if (c >= 0.95) return "High";
  if (c >= 0.80) return "Medium";
  return "Low";
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
