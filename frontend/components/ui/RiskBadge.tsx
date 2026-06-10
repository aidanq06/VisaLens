import type { RiskLevel } from "@/types/analysis";
import { riskLabel, riskColor } from "@/lib/utils";

type Props = { level: RiskLevel; size?: "sm" | "md" | "lg" };

export default function RiskBadge({ level, size = "md" }: Props) {
  const color = riskColor(level);
  const label = riskLabel(level);

  const padding =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : size === "lg"
      ? "px-4 py-1.5 text-sm"
      : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide uppercase ${padding}`}
      style={{
        color,
        background: `${color}18`,
        border: `1px solid ${color}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 5px ${color}80` }}
      />
      {label}
    </span>
  );
}
