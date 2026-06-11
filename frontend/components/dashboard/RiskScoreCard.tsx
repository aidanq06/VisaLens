"use client";

import type { VisaLensAnalysis } from "@/types/analysis";
import { riskColor, riskLabel } from "@/lib/utils";

type Props = { risk: VisaLensAnalysis["risk"] };

export default function RiskScoreCard({ risk }: Props) {
  const color = riskColor(risk.level);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(risk.score / 100, 1);
  const dashOffset = circumference * (1 - pct);

  const categories = Object.entries(risk.categories) as [
    string,
    { level: string; score: number; explanation: string }
  ][];

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{ background: "#0f1018", borderColor: "#252838" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#7a7f99", fontFamily: "var(--font-mono)" }}
          >
            Risk Score
          </p>
          <h2
            className="text-lg font-medium leading-snug"
            style={{ color: "#e4e6f0" }}
          >
            {risk.main_label}
          </h2>
        </div>

        {/* Arc gauge */}
        <div className="relative flex-shrink-0 w-32 h-32">
          <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              stroke="#1e2130"
              strokeWidth="10"
            />
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 8px ${color}60)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-3xl font-semibold leading-none tabular-nums"
              style={{ color, fontFamily: "var(--font-mono)" }}
            >
              {risk.score}
            </span>
            <span
              className="text-[10px] mt-0.5 uppercase tracking-widest"
              style={{ color: "#7a7f99", fontFamily: "var(--font-mono)" }}
            >
              {riskLabel(risk.level)}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm leading-relaxed mb-6" style={{ color: "#7a7f99" }}>
        {risk.summary}
      </p>

      {/* Why this score — auditable point trail when available */}
      <div className="mb-6">
        <p
          className="text-[11px] uppercase tracking-widest mb-3"
          style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
        >
          Why this score
        </p>
        {risk.score_breakdown && risk.score_breakdown.length > 0 ? (
          <div className="space-y-2.5">
            {risk.score_breakdown.map((item, i) => {
              const positive = item.points >= 0;
              const pointColor = positive ? "#ef4343" : "#22c55e";
              return (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-md tabular-nums"
                    style={{
                      color: pointColor,
                      background: `${pointColor}14`,
                      border: `1px solid ${pointColor}30`,
                      fontFamily: "var(--font-mono)",
                      minWidth: "44px",
                      textAlign: "center",
                    }}
                  >
                    {positive ? "+" : ""}
                    {item.points}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug" style={{ color: "#e4e6f0" }}>
                      {item.label}
                    </p>
                    {item.evidence && (
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: "#7a7f99", fontFamily: "var(--font-mono)" }}
                      >
                        &ldquo;{item.evidence}&rdquo;
                        {item.confidence != null && (
                          <span style={{ color: "#484d66" }}>
                            {" "}
                            · {Math.round(item.confidence * 100)}% confidence
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] pt-1" style={{ color: "#484d66" }}>
              Deterministic rules — the AI extracts evidence, the score itself is
              rule-based and clamped to 0–100.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {risk.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "#7a7f99" }}>
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: color }}
                />
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Category breakdown */}
      <div>
        <p
          className="text-[11px] uppercase tracking-widest mb-3"
          style={{ color: "#484d66", fontFamily: "var(--font-mono)" }}
        >
          Category breakdown
        </p>
        <div className="space-y-2.5">
          {categories.map(([key, cat]) => {
            const catColor = riskColor(cat.level as "low" | "moderate" | "medium_high" | "high");
            const barWidth = `${Math.min((cat.score / 50) * 100, 100)}%`;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs capitalize"
                    style={{
                      color: "#7a7f99",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {key.replace("_", " ")}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wide"
                    style={{ color: catColor, fontFamily: "var(--font-mono)" }}
                  >
                    {cat.level.replace("_", "-")}
                  </span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "#1e2130" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: barWidth,
                      background: catColor,
                      boxShadow: `0 0 6px ${catColor}50`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
