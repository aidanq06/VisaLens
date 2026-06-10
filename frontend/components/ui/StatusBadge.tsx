import type { RiskLevel } from "@/types/analysis";
import { RISK_LEVEL_BADGE, RISK_LEVEL_LABEL } from "@/lib/riskColors";

/** Consistent risk-level pill used across verification/report UI. */
export default function StatusBadge({
  level,
  label,
}: {
  level: RiskLevel;
  /** Optional override (defaults to the standard risk-level label). */
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${RISK_LEVEL_BADGE[level]}`}
    >
      {label ?? RISK_LEVEL_LABEL[level]}
    </span>
  );
}
